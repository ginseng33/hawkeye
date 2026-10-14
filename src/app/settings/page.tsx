import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/app/nav";
import { updateBudgetLimits, updateScoreThresholds, updateWeights } from "./actions";

export const instant = false;

const STORE_CRITERIA = [
  { key: "style_and_brands", label: "Affinità stilistica e brand venduti" },
  { key: "price_coherence", label: "Coerenza fascia di prezzo" },
  { key: "market_fit", label: "Città / mercato" },
  { key: "instagram_quality", label: "Presenza e qualità Instagram" },
];

const CREATOR_CRITERIA = [
  { key: "aesthetic_affinity", label: "Affinità estetica dai post" },
  { key: "engagement_rate", label: "Engagement rate" },
  { key: "audience_authenticity", label: "Autenticità del pubblico" },
  { key: "content_quality", label: "Qualità dei contenuti" },
];

const SERVICES = [
  { key: "anthropic", label: "Anthropic (Claude)" },
  { key: "google_places", label: "Google Places" },
  { key: "apify", label: "Apify" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();

  const [{ data: weights }, { data: limits }, { data: usageRows }, { data: thresholds }] =
    await Promise.all([
      supabase.from("scoring_weights").select("entity_type, criterion, weight"),
      supabase.from("budget_limits").select("service, monthly_limit_usd"),
      supabase
        .from("api_usage")
        .select("service, estimated_cost_usd, created_at")
        .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
      supabase.from("score_thresholds").select("entity_type, threshold"),
    ]);

  const thresholdMap = Object.fromEntries(
    (thresholds ?? []).map((t) => [t.entity_type, Number(t.threshold)])
  );

  const weightMap = Object.fromEntries(
    (weights ?? []).map((w) => [`${w.entity_type}__${w.criterion}`, Math.round(Number(w.weight) * 100)])
  );
  const limitMap = Object.fromEntries((limits ?? []).map((l) => [l.service, Number(l.monthly_limit_usd)]));
  const spendMap: Record<string, number> = {};
  for (const row of usageRows ?? []) {
    spendMap[row.service] = (spendMap[row.service] ?? 0) + Number(row.estimated_cost_usd);
  }

  const storeSum = STORE_CRITERIA.reduce((s, c) => s + (weightMap[`store__${c.key}`] ?? 0), 0);
  const creatorSum = CREATOR_CRITERIA.reduce((s, c) => s + (weightMap[`creator__${c.key}`] ?? 0), 0);

  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Impostazioni</h1>

      {saved && (
        <p className="mb-6 rounded bg-green-50 px-3 py-2 text-sm text-green-700">Salvato.</p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pesi del punteggio — Negozi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateWeights} className="flex flex-col gap-4">
            {STORE_CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-4">
                <Label htmlFor={`store__${c.key}`} className="flex-1">
                  {c.label}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    id={`store__${c.key}`}
                    name={`store__${c.key}`}
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={weightMap[`store__${c.key}`] ?? 0}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
            <p className={`text-sm ${storeSum === 100 ? "text-muted-foreground" : "text-amber-600"}`}>
              Somma attuale: {storeSum}% {storeSum !== 100 && "(dovrebbe fare 100%)"}
            </p>

            <h3 className="mt-2 font-medium">Creator</h3>
            {CREATOR_CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-4">
                <Label htmlFor={`creator__${c.key}`} className="flex-1">
                  {c.label}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    id={`creator__${c.key}`}
                    name={`creator__${c.key}`}
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={weightMap[`creator__${c.key}`] ?? 0}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
            <p className={`text-sm ${creatorSum === 100 ? "text-muted-foreground" : "text-amber-600"}`}>
              Somma attuale: {creatorSum}% {creatorSum !== 100 && "(dovrebbe fare 100%)"}
            </p>

            <Button type="submit" className="w-fit">
              Salva pesi
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Soglia minima per entrare in lista</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateScoreThresholds} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="store" className="flex-1">
                Negozi (scoperta da ricerca web)
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="store"
                  name="store"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={thresholdMap.store ?? 75}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="creator" className="flex-1">
                Influencer (scoperta da hashtag/handle)
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="creator"
                  name="creator"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={thresholdMap.creator ?? 60}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo i candidati trovati tramite le pagine &quot;Scopri nuovi&quot; con punteggio pari o
              superiore vengono salvati in lista; gli altri sono scartati automaticamente.
            </p>
            <Button type="submit" className="w-fit">
              Salva soglie
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limiti di budget mensile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateBudgetLimits} className="flex flex-col gap-4">
            {SERVICES.map((s) => {
              const spent = spendMap[s.key] ?? 0;
              const limit = limitMap[s.key] ?? 0;
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              return (
                <div key={s.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor={s.key} className="flex-1">
                      {s.label}
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        id={s.key}
                        name={s.key}
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={limit}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">/mese</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Speso questo mese: ${spent.toFixed(2)} ({pct}%)
                  </p>
                </div>
              );
            })}
            <Button type="submit" className="w-fit">
              Salva limiti
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
