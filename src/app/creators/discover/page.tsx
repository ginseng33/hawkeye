import { Nav } from "@/app/nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Nav />
      <div className="mx-auto max-w-xl p-8">
        <h1 className="mb-2 text-2xl font-semibold">Scopri nuovi influencer</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Follower {MIN_FOLLOWERS.toLocaleString("it-IT")}-{MAX_FOLLOWERS.toLocaleString("it-IT")}.
          Solo punteggio ≥ {threshold}/100 entra in lista (soglia modificabile in Impostazioni).
          L&apos;analisi guarda anche le foto dei post più recenti.
        </p>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {kept !== undefined && (
          <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            Trovati {kept} nuovi influencer validi ({rejected} scartati). Costo: ${cost}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Nuova ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={runCreatorDiscovery} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="hashtags">Hashtag o parole chiave (separati da virgola)</Label>
                <Input
                  id="hashtags"
                  name="hashtags"
                  placeholder="es. selvedgedenim, japanesedenim, archivefashion"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="seed_handles">
                  Handle specifici — es. modelli/ambassador di brand affini (separati da virgola)
                </Label>
                <Input id="seed_handles" name="seed_handles" placeholder="es. @nome1, @nome2" />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="include_brand_mentions" className="mt-1" />
                <span>
                  Includi anche chi ha già taggato @sixtyonelabs su Instagram (&quot;Seen on&quot;)
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Costo minimo 0,50$ per questa opzione, indipendentemente dai risultati.
                  </span>
                </span>
              </label>
              <div className="flex flex-col gap-2">
                <Label htmlFor="max_candidates">Max candidati da valutare</Label>
                <Input
                  id="max_candidates"
                  name="max_candidates"
                  type="number"
                  defaultValue={3}
                  min={1}
                  max={8}
                />
              </div>
              <Button type="submit" className="w-fit">
                Avvia ricerca
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
