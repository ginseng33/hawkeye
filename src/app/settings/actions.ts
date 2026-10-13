"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateWeights(formData: FormData) {
  const supabase = await createClient();

  const entries = [
    { entity_type: "store", criterion: "style_and_brands" },
    { entity_type: "store", criterion: "price_coherence" },
    { entity_type: "store", criterion: "market_fit" },
    { entity_type: "store", criterion: "instagram_quality" },
    { entity_type: "creator", criterion: "aesthetic_affinity" },
    { entity_type: "creator", criterion: "engagement_rate" },
    { entity_type: "creator", criterion: "audience_authenticity" },
    { entity_type: "creator", criterion: "content_quality" },
  ];

  for (const entry of entries) {
    const key = `${entry.entity_type}__${entry.criterion}`;
    const raw = formData.get(key);
    if (raw === null) continue;
    const percent = Number(raw);
    await supabase
      .from("scoring_weights")
      .update({ weight: percent / 100, updated_at: new Date().toISOString() })
      .eq("entity_type", entry.entity_type)
      .eq("criterion", entry.criterion);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=weights");
}

export async function updateBudgetLimits(formData: FormData) {
  const supabase = await createClient();

  for (const service of ["anthropic", "google_places", "apify"] as const) {
    const raw = formData.get(service);
    if (raw === null) continue;
    await supabase
      .from("budget_limits")
      .update({ monthly_limit_usd: Number(raw), updated_at: new Date().toISOString() })
      .eq("service", service);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=budget");
}
