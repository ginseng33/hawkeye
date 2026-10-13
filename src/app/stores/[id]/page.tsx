import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/app/nav";
import { runScoreStore, updateStore } from "./actions";

export const instant = false;

const BUSINESS_MODELS = [
  { value: "unknown", label: "Sconosciuto" },
  { value: "wholesale", label: "Wholesale" },
  { value: "consignment", label: "Conto vendita" },
];

const PIPELINE_STATUSES = [
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

export default async function StoreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error: saveError } = await searchParams;

  const supabase = await createClient();
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !store) {
    notFound();
  }

  const updateStoreWithId = updateStore.bind(null, store.id);
  const runScoreStoreWithId = runScoreStore.bind(null, store.id);

  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-2xl p-8">
      <Link href="/stores" className="text-sm text-muted-foreground hover:underline">
        ← Torna ai negozi
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">{store.name}</h1>

      {saved && (
        <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Salvato.
        </p>
      )}
      {saveError && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </p>
      )}

      <div className="mb-6 rounded border p-4">
        {store.score_total !== null ? (
          <>
            <p className="font-medium">Punteggio totale: {store.score_total}/100</p>
            <p className="text-sm text-muted-foreground">
              Stile {store.score_style} · Prezzo {store.score_price} · Mercato {store.score_market} · Instagram {store.score_instagram}
            </p>
            {store.score_rationale && (
              <p className="mt-2 text-sm text-muted-foreground">{store.score_rationale}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun punteggio calcolato ancora.</p>
        )}
        <form action={runScoreStoreWithId} className="mt-3">
          <Button type="submit" variant="secondary" size="sm">
            {store.score_total !== null ? "Ricalcola punteggio" : "Calcola punteggio"}
          </Button>
        </form>
      </div>

      <form action={updateStoreWithId} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={store.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">Città</Label>
            <Input id="city" name="city" defaultValue={store.city ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Paese</Label>
            <Input id="country" name="country" defaultValue={store.country ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input id="address" name="address" defaultValue={store.address ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="website">Sito web</Label>
            <Input id="website" name="website" defaultValue={store.website ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="instagram_handle">Instagram</Label>
            <Input
              id="instagram_handle"
              name="instagram_handle"
              defaultValue={store.instagram_handle ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={store.email ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" defaultValue={store.phone ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact_person">Buyer / titolare</Label>
            <Input
              id="contact_person"
              name="contact_person"
              defaultValue={store.contact_person ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="estimated_price_range">Fascia di prezzo</Label>
            <Input
              id="estimated_price_range"
              name="estimated_price_range"
              placeholder="es. 100-300€"
              defaultValue={store.estimated_price_range ?? ""}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="brands_sold">Brand venduti (separati da virgola)</Label>
          <Input
            id="brands_sold"
            name="brands_sold"
            defaultValue={(store.brands_sold ?? []).join(", ")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="style_tags">Stile / tag (separati da virgola)</Label>
          <Input
            id="style_tags"
            name="style_tags"
            defaultValue={(store.style_tags ?? []).join(", ")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="business_model">Modello commerciale</Label>
            <select
              id="business_model"
              name="business_model"
              defaultValue={store.business_model}
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {BUSINESS_MODELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pipeline_status">Stato pipeline</Label>
            <select
              id="pipeline_status"
              name="pipeline_status"
              defaultValue={store.pipeline_status}
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {PIPELINE_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Note</Label>
          <Textarea id="notes" name="notes" defaultValue={store.notes ?? ""} rows={4} />
        </div>

        <Button type="submit" className="w-fit">
          Salva
        </Button>
      </form>
      </div>
    </div>
  );
}
