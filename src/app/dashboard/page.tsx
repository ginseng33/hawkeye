import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { FormGroup } from "@/components/hawkeye/form-group";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  new: "Nuovo",
  to_contact: "Da contattare",
  contacted: "Contattato",
  replied: "Ha risposto",
  sample_sent: "Campione inviato",
  negotiating: "In trattativa",
  partner: "Partner",
  rejected: "Rifiutato",
  not_interested: "Non interessato",
};

function groupByStatus(rows: { pipeline_status: string }[]) {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.pipeline_status] = (counts[r.pipeline_status] ?? 0) + 1;
  return counts;
}

function scoreOutcomeStats(rows: { score_total: number | null; pipeline_status: string }[]) {
  const scored = rows.filter((r) => r.score_total !== null);
  const byStatus = new Map<string, number[]>();
  for (const r of scored) {
    const list = byStatus.get(r.pipeline_status) ?? [];
    list.push(r.score_total as number);
    byStatus.set(r.pipeline_status, list);
  }
  return [...byStatus.entries()]
    .map(([status, scores]) => ({
      status,
      count: scores.length,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-5">
      <p className="font-technical mb-1 text-[11px] text-muted-foreground">{label}</p>
      <p className="font-display tabular-nums text-[44px] leading-none text-foreground">{value}</p>
    </div>
  );
}

function StatList({ rows }: { rows: { label: string; value: string }[] }) {
  if (rows.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Nessun dato disponibile.</p>;
  }
  return (
    <>
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex min-h-11 items-center justify-between gap-4 border-b border-border px-4 py-2 last:border-b-0"
        >
          <span className="text-[14px] text-foreground">{r.label}</span>
          <span className="font-technical tabular-nums text-[12px] text-muted-foreground">{r.value}</span>
        </div>
      ))}
    </>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: stores }, { data: creators }, { data: usageRows }] = await Promise.all([
    supabase.from("stores").select("pipeline_status, score_total, source"),
    supabase.from("creators").select("pipeline_status, score_total, source"),
    supabase
      .from("api_usage")
      .select("service, estimated_cost_usd, created_at")
      .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
  ]);

  const storeRows = stores ?? [];
  const creatorRows = creators ?? [];

  const storeCounts = groupByStatus(storeRows);
  const creatorCounts = groupByStatus(creatorRows);

  const storeStats = scoreOutcomeStats(storeRows);
  const creatorStats = scoreOutcomeStats(creatorRows);

  const spendByService: Record<string, number> = {};
  for (const row of usageRows ?? []) {
    spendByService[row.service] = (spendByService[row.service] ?? 0) + Number(row.estimated_cost_usd);
  }
  const totalSpend = Object.values(spendByService).reduce((a, b) => a + b, 0);

  return (
    <div>
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[1000px] px-6 py-8">
        <LargeTitle title="Dashboard" />

        <div className="mb-6 grid grid-cols-3 gap-4">
          <KpiTile label="NEGOZI TOTALI" value={String(storeRows.length)} />
          <KpiTile label="INFLUENCER TOTALI" value={String(creatorRows.length)} />
          <KpiTile label="SPESA API QUESTO MESE" value={`$${totalSpend.toFixed(2)}`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormGroup title="Negozi per stato">
            <StatList
              rows={Object.entries(storeCounts).map(([status, count]) => ({
                label: STATUS_LABEL[status] ?? status,
                value: String(count),
              }))}
            />
          </FormGroup>
          <FormGroup title="Influencer per stato">
            <StatList
              rows={Object.entries(creatorCounts).map(([status, count]) => ({
                label: STATUS_LABEL[status] ?? status,
                value: String(count),
              }))}
            />
          </FormGroup>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormGroup title="Negozi — punteggio medio per esito">
            <StatList
              rows={storeStats.map((s) => ({
                label: `${STATUS_LABEL[s.status] ?? s.status} (${s.count})`,
                value: `${s.avgScore}/100`,
              }))}
            />
          </FormGroup>
          <FormGroup title="Influencer — punteggio medio per esito">
            <StatList
              rows={creatorStats.map((s) => ({
                label: `${STATUS_LABEL[s.status] ?? s.status} (${s.count})`,
                value: `${s.avgScore}/100`,
              }))}
            />
          </FormGroup>
        </div>

        <FormGroup title="Spesa API per servizio (questo mese)">
          <StatList
            rows={Object.entries(spendByService).map(([service, amount]) => ({
              label: service,
              value: `$${amount.toFixed(2)}`,
            }))}
          />
        </FormGroup>

        <p className="text-[12px] leading-relaxed text-muted-foreground">
          La correlazione punteggio↔esito si affina con più dati: più partner portati fino a
          &quot;Partner&quot; o &quot;Rifiutato&quot;, più questi numeri diventano utili per capire se i
          pesi dei criteri vanno aggiustati.
        </p>
      </div>
    </div>
  );
}
