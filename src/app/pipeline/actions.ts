"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setStorePipelineStatus(storeId: string, status: string) {
  const supabase = await createClient();
  await supabase
    .from("stores")
    .update({ pipeline_status: status, updated_at: new Date().toISOString() })
    .eq("id", storeId);
  revalidatePath("/pipeline");
  revalidatePath("/stores");
}

export async function setCreatorPipelineStatus(creatorId: string, status: string) {
  const supabase = await createClient();
  await supabase
    .from("creators")
    .update({ pipeline_status: status, updated_at: new Date().toISOString() })
    .eq("id", creatorId);
  revalidatePath("/pipeline");
  revalidatePath("/creators");
}
