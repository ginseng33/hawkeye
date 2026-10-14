import Link from "next/link";
import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { ScorePill } from "@/components/hawkeye/score-pill";
import { StatusSelect } from "@/components/status-select";
import { createClient } from "@/lib/supabase/server";
import { setCreatorPipelineStatus, setStorePipelineStatus } from "./actions";

export const instant = false;

const COLUMNS = [
  { value: "new", label: "Nuovo" },
  { value: "to_contact", label: "Da contattare" },
  { value: "contacted", label: "Contattato" },
  { value: "replied", label: "Ha risposto" },
  { value: "sample_sent", label: "Campione inviato" },
  { value: "negotiating", label: "In trattativa" },
  { value: "partner", label: "Partner" },
  { value: "rejected", label: "Rifiutato" },
  { value: "not_interested", label: "Non interessato" },
];

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: stores }, { data: creators }] = await Promise.all([
    supabase.from("stores").select("id, name, score_total, pipeline_status"),
    supabase.from("creators").select("id, handle, score_total, pipeline_status"),
  ]);

  type Card = { id: string; label: string; score: number | null; href: string; status: string };

  const cards: Card[] = [
    ...(stores ?? []).map((s) => ({
      id: s.id,
      label: s.name,
      score: s.score_total,
      href: `/stores/${s.id}`,
      status: s.pipeline_status,
    })),
    ...(creators ?? []).map((c) => ({
      id: c.id,
      label: `@${c.handle}`,
      score: c.score_total,
      href: `/creators/${c.id}`,
      status: c.pipeline_status,
    })),
  ];

  const storeIds = new Set((stores ?? []).map((s) => s.id));

  return (
    <div>
      <TopBar />
      <CommandPalette />
      <div className="px-6 py-8">
        <div className="mx-auto max-w-[1200px]">
          <LargeTitle title="Pipeline" subtitle={`${cards.length} partner in totale`} />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.status === col.value);
            return (
              <div key={col.value} className="w-72 flex-shrink-0 rounded-[24px] bg-muted p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="font-technical text-[11px] text-muted-foreground">{col.label}</span>
                  <span className="font-technical tabular-nums flex h-5 min-w-5 items-center justify-center rounded-full bg-card px-1.5 text-[10px] text-muted-foreground">
                    {colCards.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {colCards.map((card) => (
                    <div key={card.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                      <Link href={card.href} className="text-[14px] font-semibold hover:underline">
                        {card.label}
                      </Link>
                      <div className="mt-2 flex items-center justify-between">
                        <ScorePill score={card.score} />
                        <StatusSelect
                          id={card.id}
                          currentStatus={card.status}
                          onChangeStatus={
                            storeIds.has(card.id) ? setStorePipelineStatus : setCreatorPipelineStatus
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
