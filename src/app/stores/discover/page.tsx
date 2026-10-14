import { Nav } from "@/app/nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Nav />
      <div className="mx-auto max-w-xl p-8">
        <h1 className="mb-2 text-2xl font-semibold">Scopri nuovi negozi</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Cerca sul web (non Google Maps) negozi affini al brand per città. Solo i candidati con
          punteggio ≥ {threshold}/100 entrano in lista (soglia modificabile in Impostazioni).
        </p>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {kept !== undefined && (
          <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            Trovati {kept} nuovi negozi validi ({rejected} scartati sotto soglia). Costo: ${cost}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Nuova ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={runDiscovery} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">Città *</Label>
                <Input id="city" name="city" placeholder="es. Berlino" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="country">Paese (opzionale)</Label>
                <Input id="country" name="country" placeholder="es. Germania" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="keyword">Parola chiave (opzionale)</Label>
                <Input id="keyword" name="keyword" placeholder="es. denim selvedge, archive store" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="max_results">Max candidati</Label>
                  <Input id="max_results" name="max_results" type="number" defaultValue={3} min={1} max={10} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="max_searches">Max ricerche web</Label>
                  <Input id="max_searches" name="max_searches" type="number" defaultValue={5} min={1} max={8} />
                </div>
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
