import Link from "next/link";
import { Nav } from "@/app/nav";
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
      <Nav />
      <div className="p-8">
        <h1 className="mb-6 text-2xl font-semibold">Pipeline ({cards.length})</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.status === col.value);
            return (
              <div key={col.value} className="w-64 flex-shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{colCards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {colCards.map((card) => (
                    <div key={card.id} className="rounded border bg-card p-3">
                      <Link href={card.href} className="text-sm font-medium hover:underline">
                        {card.label}
                      </Link>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {card.score !== null ? `${card.score}/100` : "—"}
                        </span>
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
