import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { FormGroup, FormRow } from "@/components/hawkeye/form-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
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

const percentInputClass =
  "h-7 w-16 border-0 bg-transparent p-0 text-right text-[14px] tabular-nums shadow-none focus-visible:ring-0";

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
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <LargeTitle title="Impostazioni" subtitle="Pesi, soglie e budget" />

        {saved && (
          <p className="font-technical mb-6 rounded-xl border border-success/30 bg-success-tint px-4 py-2.5 text-[12px] text-success">
            Salvato
          </p>
        )}

        <form action={updateWeights}>
          <FormGroup title="Pesi — Negozi">
            {STORE_CRITERIA.map((c) => (
              <FormRow key={c.key} label={c.label}>
                <div className="flex items-center justify-end gap-1">
                  <Input
                    id={`store__${c.key}`}
                    name={`store__${c.key}`}
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={weightMap[`store__${c.key}`] ?? 0}
                    className={percentInputClass}
                  />
                  <span className="font-technical text-[11px] text-muted-foreground">%</span>
                </div>
              </FormRow>
            ))}
          </FormGroup>
          <p className={`font-technical -mt-4 mb-6 px-1 text-[11px] ${storeSum === 100 ? "text-muted-foreground" : "text-warning"}`}>
            SOMMA: {storeSum}% {storeSum !== 100 && "(dovrebbe fare 100%)"}
          </p>

          <FormGroup title="Pesi — Influencer">
            {CREATOR_CRITERIA.map((c) => (
              <FormRow key={c.key} label={c.label}>
                <div className="flex items-center justify-end gap-1">
                  <Input
                    id={`creator__${c.key}`}
                    name={`creator__${c.key}`}
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={weightMap[`creator__${c.key}`] ?? 0}
                    className={percentInputClass}
                  />
                  <span className="font-technical text-[11px] text-muted-foreground">%</span>
                </div>
              </FormRow>
            ))}
          </FormGroup>
          <p className={`font-technical -mt-4 mb-6 px-1 text-[11px] ${creatorSum === 100 ? "text-muted-foreground" : "text-warning"}`}>
            SOMMA: {creatorSum}% {creatorSum !== 100 && "(dovrebbe fare 100%)"}
          </p>

          <Button type="submit" className="mb-6">
            Salva pesi
          </Button>
        </form>

        <form action={updateScoreThresholds}>
          <FormGroup title="Soglia minima per entrare in lista">
            <FormRow label="Negozi (ricerca web)">
              <div className="flex items-center justify-end gap-1">
                <Input
                  id="store"
                  name="store"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={thresholdMap.store ?? 75}
                  className={percentInputClass}
                />
                <span className="font-technical text-[11px] text-muted-foreground">/100</span>
              </div>
            </FormRow>
            <FormRow label="Influencer (hashtag/handle)">
              <div className="flex items-center justify-end gap-1">
                <Input
                  id="creator"
                  name="creator"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={thresholdMap.creator ?? 60}
                  className={percentInputClass}
                />
                <span className="font-technical text-[11px] text-muted-foreground">/100</span>
              </div>
            </FormRow>
          </FormGroup>
          <Button type="submit" className="mb-6">
            Salva soglie
          </Button>
        </form>

        <form action={updateBudgetLimits}>
          <FormGroup title="Limiti di budget mensile">
            {SERVICES.map((s) => {
              const spent = spendMap[s.key] ?? 0;
              const limit = limitMap[s.key] ?? 0;
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              return (
                <FormRow key={s.key} label={s.label} stacked>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-technical text-[11px] text-muted-foreground">$</span>
                      <Input
                        id={s.key}
                        name={s.key}
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={limit}
                        className="h-7 w-24 border-0 bg-transparent p-0 text-[14px] tabular-nums shadow-none focus-visible:ring-0"
                      />
                      <span className="font-technical text-[11px] text-muted-foreground">/MESE</span>
                    </div>
                    <span className="font-technical text-[11px] text-muted-foreground">
                      SPESO ${spent.toFixed(2)} ({pct}%)
                    </span>
                  </div>
                </FormRow>
              );
            })}
          </FormGroup>
          <Button type="submit">Salva limiti</Button>
        </form>
      </div>
    </div>
  );
}
