import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { FormGroup, FormRow } from "@/components/hawkeye/form-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SCORE_THRESHOLD } from "@/lib/discovery/find-stores";
import { createClient } from "@/lib/supabase/server";
import { runDiscovery } from "./actions";

export const instant = false;

export default async function DiscoverStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ kept?: string; rejected?: string; cost?: string; error?: string }>;
}) {
  const { kept, rejected, cost, error } = await searchParams;
  const supabase = await createClient();
  const { data: thresholdRow } = await supabase
    .from("score_thresholds")
    .select("threshold")
    .eq("entity_type", "store")
    .single();
  const threshold = thresholdRow ? Number(thresholdRow.threshold) : DEFAULT_SCORE_THRESHOLD;

  return (
    <div>
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[600px] px-6 py-8">
        <LargeTitle title="Scopri negozi" />
        <p className="font-technical -mt-6 mb-6 text-[11px] text-muted-foreground">
          RICERCA WEB (NON GOOGLE MAPS) · SOGLIA ≥ {threshold}/100 · MODIFICABILE IN IMPOSTAZIONI
        </p>

        {error && (
          <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}
        {kept !== undefined && (
          <p className="font-technical mb-4 rounded-xl border border-success/30 bg-success-tint px-4 py-2.5 text-[12px] text-success">
            TROVATI {kept} · SCARTATI {rejected} · COSTO ${cost}
          </p>
        )}

        <form action={runDiscovery}>
          <FormGroup>
            <FormRow label="Città *" stacked>
              <Input id="city" name="city" placeholder="es. Berlino" required />
            </FormRow>
            <FormRow label="Paese (opzionale)" stacked>
              <Input id="country" name="country" placeholder="es. Germania" />
            </FormRow>
            <FormRow label="Parola chiave (opzionale)" stacked>
              <Input id="keyword" name="keyword" placeholder="es. denim selvedge, archive store" />
            </FormRow>
            <FormRow label="Max candidati">
              <Input
                id="max_results"
                name="max_results"
                type="number"
                defaultValue={3}
                min={1}
                max={10}
                className="h-7 w-16 border-0 bg-transparent p-0 text-right text-[14px] tabular-nums shadow-none focus-visible:ring-0"
              />
            </FormRow>
            <FormRow label="Max ricerche web">
              <Input
                id="max_searches"
                name="max_searches"
                type="number"
                defaultValue={5}
                min={1}
                max={8}
                className="h-7 w-16 border-0 bg-transparent p-0 text-right text-[14px] tabular-nums shadow-none focus-visible:ring-0"
              />
            </FormRow>
          </FormGroup>
          <Button type="submit">Avvia ricerca</Button>
        </form>
      </div>
    </div>
  );
}
