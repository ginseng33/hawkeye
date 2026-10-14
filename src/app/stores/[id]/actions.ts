"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreStore } from "@/lib/scoring/score-store";
import { generateMessageDraft } from "@/lib/messaging/generate-draft";

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

export async function generateStoreDraft(storeId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: store, error } = await supabase
    .from("stores")
    .select("id, name, city, country, contact_person, brands_sold, score_rationale")
    .eq("id", storeId)
    .single();

  if (error || !store) {
    redirect(`/stores/${storeId}?error=${encodeURIComponent("Negozio non trovato")}`);
  }

  const channel = (formData.get("channel") as "email" | "dm") || "email";
  const variantLabel = (formData.get("variant_label") as string)?.trim() || "default";

  try {
    const body = await generateMessageDraft(supabase, { type: "store", ...store }, channel, variantLabel);
    await supabase.from("message_drafts").insert({
      store_id: storeId,
      channel,
      variant_label: variantLabel,
      body,
      status: "draft",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore nella generazione del messaggio";
    redirect(`/stores/${storeId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/stores/${storeId}`);
}

export async function markStoreDraftSent(draftId: string) {
  const supabase = await createClient();
  await supabase.from("message_drafts").update({ status: "sent" }).eq("id", draftId);
  revalidatePath("/stores", "layout");
}

export async function deleteStoreDraft(draftId: string) {
  const supabase = await createClient();
  await supabase.from("message_drafts").delete().eq("id", draftId);
  revalidatePath("/stores", "layout");
}

export async function logStoreInteraction(storeId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("interactions").insert({
    store_id: storeId,
    created_by: user?.id,
    channel: formData.get("channel"),
    interaction_type: formData.get("interaction_type"),
    notes: formData.get("notes") || null,
  });

  revalidatePath(`/stores/${storeId}`);
}
