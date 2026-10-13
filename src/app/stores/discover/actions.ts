"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { discoverStores } from "@/lib/discovery/find-stores";

export async function runDiscovery(formData: FormData) {
  const supabase = await createClient();

  const city = (formData.get("city") as string)?.trim();
  const country = (formData.get("country") as string)?.trim() || undefined;
  const keyword = (formData.get("keyword") as string)?.trim() || undefined;
  const maxResults = Math.min(Number(formData.get("max_results")) || 3, 10);
  const maxSearches = Math.min(Number(formData.get("max_searches")) || 5, 8);

  if (!city) {
    redirect(`/stores/discover?error=${encodeURIComponent("Città obbligatoria")}`);
  }

  let redirectUrl: string;
  try {
    const result = await discoverStores(supabase, { city, country, keyword, maxResults, maxSearches });
    revalidatePath("/stores");
    revalidatePath("/stores/discover");
    redirectUrl = `/stores/discover?kept=${result.kept.length}&rejected=${result.rejected.length}&cost=${result.costUsd.toFixed(3)}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore durante la ricerca";
    redirectUrl = `/stores/discover?error=${encodeURIComponent(message)}`;
  }
  redirect(redirectUrl);
}
