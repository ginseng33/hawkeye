import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { FormGroup, FormRow } from "@/components/hawkeye/form-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SCORE_THRESHOLD, MIN_FOLLOWERS, MAX_FOLLOWERS } from "@/lib/discovery/find-creators";
import { createClient } from "@/lib/supabase/server";
import { runCreatorDiscovery } from "./actions";

export const instant = false;

export default async function DiscoverCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ kept?: string; rejected?: string; cost?: string; error?: string }>;
}) {
  const { kept, rejected, cost, error } = await searchParams;
  const supabase = await createClient();
  const { data: thresholdRow } = await supabase
    .from("score_thresholds")
    .select("threshold")
    .eq("entity_type", "creator")
    .single();
  const threshold = thresholdRow ? Number(thresholdRow.threshold) : DEFAULT_SCORE_THRESHOLD;

  return (
    <div>
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[600px] px-6 py-8">
        <LargeTitle title="Scopri influencer" />
        <p className="font-technical -mt-6 mb-6 text-[11px] text-muted-foreground">
          FOLLOWER {MIN_FOLLOWERS.toLocaleString("it-IT")}-{MAX_FOLLOWERS.toLocaleString("it-IT")} · SOGLIA ≥{" "}
          {threshold}/100 · ANALISI ANCHE VISIVA
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

        <form action={runCreatorDiscovery}>
          <FormGroup>
            <FormRow label="Hashtag / parole chiave" stacked>
              <Input
                id="hashtags"
                name="hashtags"
                placeholder="es. selvedgedenim, japanesedenim, archivefashion"
              />
            </FormRow>
            <FormRow label="Handle specifici (ambassador di brand affini)" stacked>
              <Input id="seed_handles" name="seed_handles" placeholder="es. @nome1, @nome2" />
            </FormRow>
            <FormRow label="Max candidati">
              <Input
                id="max_candidates"
                name="max_candidates"
                type="number"
                defaultValue={3}
                min={1}
                max={8}
                className="h-7 w-16 border-0 bg-transparent p-0 text-right text-[14px] tabular-nums shadow-none focus-visible:ring-0"
              />
            </FormRow>
          </FormGroup>

          <label className="mb-6 flex items-start gap-2.5 rounded-[20px] border border-border bg-card p-4 text-[13px]">
            <input type="checkbox" name="include_brand_mentions" className="mt-1" />
            <span>
              Includi chi ha già taggato @sixtyonelabs su Instagram (&quot;Seen on&quot;)
              <br />
              <span className="font-technical text-[11px] text-muted-foreground">
                COSTO MINIMO 0,50$ PER QUESTA OPZIONE
              </span>
            </span>
          </label>

          <Button type="submit">Avvia ricerca</Button>
        </form>
      </div>
    </div>
  );
}
