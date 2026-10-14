import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StoresListClient } from "./stores-list-client";

// Entire page depends on the signed-in user's session; nothing to prerender.
export const instant = false;

export default async function StoresPage() {
  const supabase = await createClient();
  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, name, city, country, instagram_handle, score_total, pipeline_status")
    .order("name");

  if (error) {
    return <p className="p-8 text-red-500">Errore nel caricare i negozi: {error.message}</p>;
  }

  return (
    <div>
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <LargeTitle
          title="Negozi"
          subtitle={`${stores?.length ?? 0} in totale`}
          action={
            <Link href="/stores/discover" className={buttonVariants({ variant: "default" })}>
              Scopri nuovi
            </Link>
          }
        />
        <StoresListClient stores={stores ?? []} />
      </div>
    </div>
  );
}
