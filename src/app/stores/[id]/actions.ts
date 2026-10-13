"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
