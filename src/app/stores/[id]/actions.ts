"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreStore } from "@/lib/scoring/score-store";

export async function updateStore(storeId: string, formData: FormData) {
  const supabase = await createClient();

  const brandsSold = (formData.get("brands_sold") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const styleTags = (formData.get("style_tags") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("stores")
    .update({
      name: formData.get("name"),
      city: formData.get("city") || null,
      country: formData.get("country") || null,
      address: formData.get("address") || null,
      website: formData.get("website") || null,
      instagram_handle: formData.get("instagram_handle") || null,
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      contact_person: formData.get("contact_person") || null,
      brands_sold: brandsSold,
      estimated_price_range: formData.get("estimated_price_range") || null,
      style_tags: styleTags,
      business_model: formData.get("business_model"),
      pipeline_status: formData.get("pipeline_status"),
      notes: formData.get("notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (error) {
    redirect(`/stores/${storeId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/stores/${storeId}`);
  revalidatePath("/stores");
  redirect(`/stores/${storeId}?saved=1`);
}

export async function runScoreStore(storeId: string) {
  const supabase = await createClient();

  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select(
      "id, name, city, country, website, instagram_handle, brands_sold, style_tags, estimated_price_range, notes"
    )
    .eq("id", storeId)
    .single();

  if (fetchError || !store) {
    redirect(`/stores/${storeId}?error=${encodeURIComponent("Negozio non trovato")}`);
  }

  try {
    const result = await scoreStore(supabase, store);

    const { error: updateError } = await supabase
      .from("stores")
      .update({
        score_style: result.score_style,
        score_price: result.score_price,
        score_market: result.score_market,
        score_instagram: result.score_instagram,
        score_total: result.score_total,
        score_rationale: result.score_rationale,
        market_tier: result.market_tier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (updateError) throw updateError;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore durante il calcolo del punteggio";
    redirect(`/stores/${storeId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/stores/${storeId}`);
  revalidatePath("/stores");
  redirect(`/stores/${storeId}?saved=1`);
}
