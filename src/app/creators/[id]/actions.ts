"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
