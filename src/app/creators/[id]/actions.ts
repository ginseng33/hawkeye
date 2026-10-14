"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateMessageDraft } from "@/lib/messaging/generate-draft";

export async function updateCreator(creatorId: string, formData: FormData) {
  const supabase = await createClient();

  const aestheticTags = (formData.get("aesthetic_tags") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("creators")
    .update({
      full_name: formData.get("full_name") || null,
      city: formData.get("city") || null,
      follower_count: Number(formData.get("follower_count")) || null,
      pipeline_status: formData.get("pipeline_status"),
      aesthetic_tags: aestheticTags,
      notes: formData.get("notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creatorId);

  if (error) {
    redirect(`/creators/${creatorId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/creators");
  redirect(`/creators/${creatorId}?saved=1`);
}

export async function generateCreatorDraft(creatorId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: creator, error } = await supabase
    .from("creators")
    .select("id, handle, full_name, follower_count, score_rationale")
    .eq("id", creatorId)
    .single();

  if (error || !creator) {
    redirect(`/creators/${creatorId}?error=${encodeURIComponent("Creator non trovato")}`);
  }

  const channel = (formData.get("channel") as "email" | "dm") || "dm";
  const variantLabel = (formData.get("variant_label") as string)?.trim() || "default";

  try {
    const body = await generateMessageDraft(
      supabase,
      { type: "creator", ...creator },
      channel,
      variantLabel
    );
    await supabase.from("message_drafts").insert({
      creator_id: creatorId,
      channel,
      variant_label: variantLabel,
      body,
      status: "draft",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore nella generazione del messaggio";
    redirect(`/creators/${creatorId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/creators/${creatorId}`);
}

export async function markCreatorDraftSent(draftId: string) {
  const supabase = await createClient();
  await supabase.from("message_drafts").update({ status: "sent" }).eq("id", draftId);
  revalidatePath("/creators", "layout");
}

export async function deleteCreatorDraft(draftId: string) {
  const supabase = await createClient();
  await supabase.from("message_drafts").delete().eq("id", draftId);
  revalidatePath("/creators", "layout");
}

export async function logCreatorInteraction(creatorId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("interactions").insert({
    creator_id: creatorId,
    created_by: user?.id,
    channel: formData.get("channel"),
    interaction_type: formData.get("interaction_type"),
    notes: formData.get("notes") || null,
  });

  revalidatePath(`/creators/${creatorId}`);
}
