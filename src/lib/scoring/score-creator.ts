import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
import { BRAND_BRIEF } from "@/lib/brand-config";
import { assertBudgetAvailable, logApiUsage } from "@/lib/budget";

const MODEL = "claude-sonnet-5";
const INPUT_COST_PER_TOKEN = 2 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 10 / 1_000_000;

type CreatorCandidate = {
  id: string;
  handle: string;
  full_name: string | null;
  biography: string | null;
  follower_count: number;
  posts_count: number | null;
  post_images: string[]; // up to ~4-6 recent post image URLs
  avg_likes: number;
  avg_comments: number;
};

type AiSubScores = {
  score_aesthetic: number;
  score_authenticity: number;
  score_content_quality: number;
  rationale: string;
};

const SUBMIT_SCORE_TOOL: Anthropic.Tool = {
  name: "submit_score",
  description: "Submit the affinity sub-scores for this creator.",
  input_schema: {
    type: "object",
    properties: {
      score_aesthetic: {
        type: "number",
        description: "0-100: affinità estetica dei post con lo stile del brand (denim, palette terrosa, giapponese/sobrio)",
      },
      score_authenticity: {
        type: "number",
        description:
          "0-100: quanto il pubblico/engagement sembra autentico (non comprato) — valuta coerenza tra numero di follower, qualità dei commenti visibili nelle caption, naturalezza dei contenuti. Se non ci sono segnali chiari, assegna un punteggio prudente intorno a 50",
      },
      score_content_quality: {
        type: "number",
        description: "0-100: qualità fotografica/editoriale dei contenuti (luce, composizione, coerenza del feed)",
      },
      rationale: {
        type: "string",
        description: "2-4 frasi in italiano che spiegano i punteggi, citando cosa si vede nelle immagini",
      },
    },
    required: ["score_aesthetic", "score_authenticity", "score_content_quality", "rationale"],
  },
};

async function getWeights(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("scoring_weights")
    .select("criterion, weight")
    .eq("entity_type", "creator");

  const weights = Object.fromEntries((data ?? []).map((r) => [r.criterion, Number(r.weight)]));
  return {
    aesthetic: weights.aesthetic_affinity ?? 0.4,
    engagement: weights.engagement_rate ?? 0.3,
    authenticity: weights.audience_authenticity ?? 0.15,
    contentQuality: weights.content_quality ?? 0.15,
  };
}

// Engagement rate is computed deterministically (not AI-judged), using
// benchmarks typical for micro-influencers (3k-50k followers) on Instagram.
export function engagementScoreFor(avgLikes: number, avgComments: number, followers: number): {
  rate: number;
  score: number;
} {
  if (followers <= 0) return { rate: 0, score: 0 };
  const rate = (avgLikes + avgComments) / followers;

  let score: number;
  if (rate >= 0.08) score = 100;
  else if (rate >= 0.06) score = 90;
  else if (rate >= 0.04) score = 75;
  else if (rate >= 0.025) score = 60;
  else if (rate >= 0.015) score = 45;
  else if (rate >= 0.008) score = 25;
  else score = 10;

  return { rate: Math.round(rate * 1000) / 10, score };
}

export async function scoreCreator(supabase: SupabaseClient, creator: CreatorCandidate) {
  await assertBudgetAvailable(supabase, "anthropic");

  const weights = await getWeights(supabase);
  const { rate: engagementRatePct, score: scoreEngagement } = engagementScoreFor(
    creator.avg_likes,
    creator.avg_comments,
    creator.follower_count
  );

  const client = new Anthropic({
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
      : undefined,
  });

  // Instagram's CDN disallows server-side fetches via robots.txt, so Claude
  // can't load the images by URL — download them here and send as base64.
  const imageBlocks: Anthropic.ImageBlockParam[] = [];
  for (const url of creator.post_images.slice(0, 5)) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await res.arrayBuffer());
      imageBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: buffer.toString("base64"),
        },
      });
    } catch {
      // Skip images that fail to download; scoring proceeds with fewer images.
    }
  }

  const userPrompt = `
Valuta questo micro-influencer come possibile collaboratore per il brand descritto sopra.

Handle: @${creator.handle}
Nome: ${creator.full_name ?? "?"}
Bio: ${creator.biography ?? "nessuna bio"}
Follower: ${creator.follower_count}
Post totali: ${creator.posts_count ?? "?"}
Engagement rate calcolato: ${engagementRatePct}% (like+commenti medi / follower)

Qui sotto le immagini dei suoi post più recenti. Valuta affinità estetica, autenticità del pubblico e qualità dei contenuti.
`.trim();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `Sei un assistente che valuta l'affinità tra micro-influencer (3k-50k follower) e un brand di moda indipendente, secondo il brief seguente.\n\n${BRAND_BRIEF}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [SUBMIT_SCORE_TOOL],
    tool_choice: { type: "tool", name: "submit_score" },
    messages: [
      {
        role: "user",
        content: [...imageBlocks, { type: "text", text: userPrompt }],
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude non ha restituito un punteggio valido.");
  }

  const ai = toolUse.input as AiSubScores;

  const scoreTotal =
    ai.score_aesthetic * weights.aesthetic +
    scoreEngagement * weights.engagement +
    ai.score_authenticity * weights.authenticity +
    ai.score_content_quality * weights.contentQuality;

  const cost =
    response.usage.input_tokens * INPUT_COST_PER_TOKEN +
    response.usage.output_tokens * OUTPUT_COST_PER_TOKEN;

  await logApiUsage(supabase, "anthropic", "score_creator", cost, {
    creator_id: creator.id,
    model: MODEL,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  });

  return {
    score_aesthetic: ai.score_aesthetic,
    score_engagement: scoreEngagement,
    score_authenticity: ai.score_authenticity,
    score_content_quality: ai.score_content_quality,
    score_total: Math.round(scoreTotal * 10) / 10,
    score_rationale: `${ai.rationale} (Engagement: ${engagementRatePct}% → ${scoreEngagement}/100, calcolato dai dati, non valutato dall'AI.)`,
    engagement_rate: engagementRatePct,
  };
}
