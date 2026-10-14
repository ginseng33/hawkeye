import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Nav } from "@/app/nav";
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
      <Nav />
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Negozi totali</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{storeRows.length}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Influencer totali
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{creatorRows.length}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Spesa API questo mese
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">${totalSpend.toFixed(2)}</CardContent>
          </Card>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Negozi per stato</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1 text-sm">
                {Object.entries(storeCounts).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span>{STATUS_LABEL[status] ?? status}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Influencer per stato</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1 text-sm">
                {Object.entries(creatorCounts).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span>{STATUS_LABEL[status] ?? status}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Negozi — punteggio medio per esito</CardTitle>
            </CardHeader>
            <CardContent>
              {storeStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Non ci sono ancora abbastanza dati (nessun negozio con punteggio calcolato).
                </p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {storeStats.map((s) => (
                    <li key={s.status} className="flex justify-between">
                      <span>
                        {STATUS_LABEL[s.status] ?? s.status} ({s.count})
                      </span>
                      <span className="font-medium">{s.avgScore}/100</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Influencer — punteggio medio per esito</CardTitle>
            </CardHeader>
            <CardContent>
              {creatorStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Non ci sono ancora abbastanza dati (nessun influencer con punteggio calcolato).
                </p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {creatorStats.map((s) => (
                    <li key={s.status} className="flex justify-between">
                      <span>
                        {STATUS_LABEL[s.status] ?? s.status} ({s.count})
                      </span>
                      <span className="font-medium">{s.avgScore}/100</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spesa API per servizio (questo mese)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {Object.entries(spendByService).map(([service, amount]) => (
                <li key={service} className="flex justify-between">
                  <span>{service}</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </li>
              ))}
              {Object.keys(spendByService).length === 0 && (
                <p className="text-sm text-muted-foreground">Nessuna spesa registrata questo mese.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          La correlazione punteggio↔esito si affina con più dati: più partner portati fino a
          &quot;Partner&quot; o &quot;Rifiutato&quot;, più questi numeri diventano utili per capire se i
          pesi dei criteri vanno aggiustati.
        </p>
      </div>
    </div>
  );
}
