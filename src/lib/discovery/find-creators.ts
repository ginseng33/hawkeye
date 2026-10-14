import { SupabaseClient } from "@supabase/supabase-js";
import { assertBudgetAvailable, logApiUsage } from "@/lib/budget";
import { scoreCreator } from "@/lib/scoring/score-creator";

export const SCORE_THRESHOLD = 75;
export const MIN_FOLLOWERS = 3000;
export const MAX_FOLLOWERS = 50000;

const APIFY_BASE = "https://api.apify.com/v2/acts";

async function runApifyActor<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const token = process.env.APIFY_API_TOKEN;
  const res = await fetch(`${APIFY_BASE}/${actorId}/run-sync-get-dataset-items?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Apify actor ${actorId} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

type HashtagPost = { ownerUsername: string };
type TaggedPost = { ownerUsername: string };
type Profile = {
  username: string;
  fullName: string | null;
  biography: string | null;
  followersCount: number;
  postsCount: number;
  private: boolean;
  latestPosts: { displayUrl: string; likesCount: number; commentsCount: number }[];
};

export type DiscoverCreatorsParams = {
  hashtags: string[];
  seedHandles: string[];
  includeBrandMentions: boolean;
  maxCandidates: number;
};

export type DiscoveryResult = {
  kept: { handle: string; score: number }[];
  rejected: { handle: string; score: number; reason: string }[];
  candidatesEvaluated: number;
  costUsd: number;
};

export async function discoverCreators(
  supabase: SupabaseClient,
  params: DiscoverCreatorsParams
): Promise<DiscoveryResult> {
  await assertBudgetAvailable(supabase, "apify");
  await assertBudgetAvailable(supabase, "anthropic");

  const candidateUsernames = new Set<string>();
  const sourceByUsername = new Map<string, "hashtag" | "seed_handle" | "brand_mentions">();
  let apifyCost = 0;

  // 1. Hashtags
  if (params.hashtags.length > 0) {
    const posts = await runApifyActor<HashtagPost>("apify~instagram-hashtag-scraper", {
      hashtags: params.hashtags,
      resultsLimit: 15,
    });
    apifyCost += posts.length * 0.0023;
    for (const p of posts) {
      if (p.ownerUsername) {
        const u = p.ownerUsername.toLowerCase();
        if (!candidateUsernames.has(u)) sourceByUsername.set(u, "hashtag");
        candidateUsernames.add(u);
      }
    }
  }

  // 2. Seed handles (given directly, no scraping needed to discover them)
  for (const handle of params.seedHandles) {
    const u = handle.trim().toLowerCase().replace(/^@/, "");
    if (!u) continue;
    if (!candidateUsernames.has(u)) sourceByUsername.set(u, "seed_handle");
    candidateUsernames.add(u);
  }

  // 3. Brand mentions ("SEEN ON" — people who tagged @sixtyonelabs). Has a $0.50 minimum charge per run.
  if (params.includeBrandMentions) {
    const tagged = await runApifyActor<TaggedPost>("apify~instagram-tagged-scraper", {
      username: ["sixtyonelabs"],
      resultsLimit: 10,
    });
    apifyCost += Math.max(tagged.length * 0.0027, 0.5);
    for (const p of tagged) {
      if (p.ownerUsername) {
        const u = p.ownerUsername.toLowerCase();
        if (!candidateUsernames.has(u)) sourceByUsername.set(u, "brand_mentions");
        candidateUsernames.add(u);
      }
    }
  }

  // Dedupe against creators already in the database.
  const { data: existing } = await supabase.from("creators").select("handle");
  const existingHandles = new Set((existing ?? []).map((r) => r.handle.toLowerCase()));
  const newUsernames = [...candidateUsernames].filter((u) => !existingHandles.has(u));

  // Cap how many profiles we fetch to keep cost and review volume low.
  const toFetch = newUsernames.slice(0, Math.max(params.maxCandidates * 3, 10));

  if (toFetch.length === 0) {
    await logApiUsage(supabase, "apify", "discover_creators", apifyCost, {
      candidates_found: 0,
    });
    return { kept: [], rejected: [], candidatesEvaluated: 0, costUsd: apifyCost };
  }

  const profiles = await runApifyActor<Profile>("apify~instagram-profile-scraper", {
    usernames: toFetch,
  });
  apifyCost += profiles.length * 0.0023;

  await logApiUsage(supabase, "apify", "discover_creators", apifyCost, {
    hashtags: params.hashtags,
    seed_handles_count: params.seedHandles.length,
    brand_mentions: params.includeBrandMentions,
    profiles_fetched: profiles.length,
  });

  const kept: DiscoveryResult["kept"] = [];
  const rejected: DiscoveryResult["rejected"] = [];
  let evaluated = 0;

  for (const profile of profiles) {
    if (evaluated >= params.maxCandidates) break;
    if (profile.private) {
      rejected.push({ handle: profile.username, score: 0, reason: "account privato" });
      continue;
    }
    if (profile.followersCount < MIN_FOLLOWERS || profile.followersCount > MAX_FOLLOWERS) {
      rejected.push({
        handle: profile.username,
        score: 0,
        reason: `follower fuori range (${profile.followersCount})`,
      });
      continue;
    }
    if (!profile.latestPosts || profile.latestPosts.length === 0) {
      rejected.push({ handle: profile.username, score: 0, reason: "nessun post recente" });
      continue;
    }

    const recentPosts = profile.latestPosts.slice(0, 12);
    const avgLikes = recentPosts.reduce((s, p) => s + (p.likesCount || 0), 0) / recentPosts.length;
    const avgComments =
      recentPosts.reduce((s, p) => s + (p.commentsCount || 0), 0) / recentPosts.length;
    const postImages = recentPosts.slice(0, 5).map((p) => p.displayUrl).filter(Boolean);

    const source = sourceByUsername.get(profile.username.toLowerCase()) ?? "manual";

    const { data: inserted, error: insertError } = await supabase
      .from("creators")
      .insert({
        handle: profile.username,
        full_name: profile.fullName,
        follower_count: profile.followersCount,
        avg_likes: Math.round(avgLikes),
        avg_comments: Math.round(avgComments),
        notes: profile.biography,
        source,
        pipeline_status: "new",
      })
      .select("id, handle, full_name")
      .single();

    if (insertError || !inserted) {
      rejected.push({ handle: profile.username, score: 0, reason: "errore inserimento" });
      continue;
    }

    evaluated++;

    try {
      const result = await scoreCreator(supabase, {
        id: inserted.id,
        handle: profile.username,
        full_name: profile.fullName,
        biography: profile.biography,
        follower_count: profile.followersCount,
        posts_count: profile.postsCount,
        post_images: postImages,
        avg_likes: Math.round(avgLikes),
        avg_comments: Math.round(avgComments),
      });

      if (result.score_total >= SCORE_THRESHOLD) {
        await supabase
          .from("creators")
          .update({
            score_aesthetic: result.score_aesthetic,
            score_engagement: result.score_engagement,
            score_authenticity: result.score_authenticity,
            score_content_quality: result.score_content_quality,
            score_total: result.score_total,
            score_rationale: result.score_rationale,
            engagement_rate: result.engagement_rate,
          })
          .eq("id", inserted.id);
        kept.push({ handle: profile.username, score: result.score_total });
      } else {
        await supabase.from("creators").delete().eq("id", inserted.id);
        rejected.push({ handle: profile.username, score: result.score_total, reason: "sotto soglia" });
      }
    } catch (err) {
      await supabase.from("creators").delete().eq("id", inserted.id);
      rejected.push({
        handle: profile.username,
        score: 0,
        reason: err instanceof Error ? err.message : "errore scoring",
      });
    }
  }

  return { kept, rejected, candidatesEvaluated: evaluated, costUsd: apifyCost };
}
