import Link from "next/link";
import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { CreatorsListClient } from "./creators-list-client";

export const instant = false;

export default async function CreatorsPage() {
  const supabase = await createClient();
  const { data: creators, error } = await supabase
    .from("creators")
    .select("id, handle, full_name, follower_count, engagement_rate, score_total, pipeline_status")
    .order("score_total", { ascending: false, nullsFirst: false });

  if (error) {
    return <p className="p-8 text-red-500">Errore nel caricare i creator: {error.message}</p>;
  }

  return (
    <div>
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <LargeTitle
          title="Influencer"
          subtitle={`${creators?.length ?? 0} in totale`}
          action={
            <Link href="/creators/discover" className={buttonVariants({ variant: "default" })}>
              Scopri nuovi
            </Link>
          }
        />
        <CreatorsListClient creators={creators ?? []} />
      </div>
    </div>
  );
}
