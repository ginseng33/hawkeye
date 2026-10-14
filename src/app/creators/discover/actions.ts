"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { discoverCreators } from "@/lib/discovery/find-creators";

export async function runCreatorDiscovery(formData: FormData) {
  const supabase = await createClient();

  const hashtags = (formData.get("hashtags") as string)
    .split(",")
    .map((s) => s.trim().replace(/^#/, ""))
    .filter(Boolean);
  const seedHandles = (formData.get("seed_handles") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const includeBrandMentions = formData.get("include_brand_mentions") === "on";
  const maxCandidates = Math.min(Number(formData.get("max_candidates")) || 3, 8);

  if (hashtags.length === 0 && seedHandles.length === 0 && !includeBrandMentions) {
    redirect(
      `/creators/discover?error=${encodeURIComponent("Inserisci almeno un hashtag, un handle o attiva 'Seen on'")}`
    );
  }

  let redirectUrl: string;
  try {
    const result = await discoverCreators(supabase, {
      hashtags,
      seedHandles,
      includeBrandMentions,
      maxCandidates,
    });
    revalidatePath("/creators");
    revalidatePath("/creators/discover");
    redirectUrl = `/creators/discover?kept=${result.kept.length}&rejected=${result.rejected.length}&cost=${result.costUsd.toFixed(3)}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore durante la ricerca";
    redirectUrl = `/creators/discover?error=${encodeURIComponent(message)}`;
  }
  redirect(redirectUrl);
}
