import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { ScoreRing, SubScoreBar } from "@/components/hawkeye/score-ring";
import { StatusPill } from "@/components/hawkeye/status-pill";
import { FormGroup, FormRow } from "@/components/hawkeye/form-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { DraftsPanel } from "@/components/drafts-panel";
import { InteractionsSection } from "@/components/interactions-section";
import {
  deleteStoreDraft,
  generateStoreDraft,
  logStoreInteraction,
  markStoreDraftSent,
  runScoreStore,
  updateStore,
} from "./actions";

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

const fieldInputClass =
  "h-7 border-0 bg-transparent p-0 text-right text-[14px] shadow-none focus-visible:ring-0";

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

  const { data: drafts } = await supabase
    .from("message_drafts")
    .select("id, channel, variant_label, body, status")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const { data: interactions } = await supabase
    .from("interactions")
    .select("id, occurred_at, channel, interaction_type, notes")
    .eq("store_id", store.id)
    .order("occurred_at", { ascending: false });

  const updateStoreWithId = updateStore.bind(null, store.id);
  const runScoreStoreWithId = runScoreStore.bind(null, store.id);
  const generateStoreDraftWithId = generateStoreDraft.bind(null, store.id);
  const logStoreInteractionWithId = logStoreInteraction.bind(null, store.id);

  return (
    <div>
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[720px] px-6 py-8">
        <Link
          href="/stores"
          className="font-technical mb-4 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          NEGOZI
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-[32px] leading-tight text-foreground">{store.name}</h1>
            <p className="font-technical mt-1 text-[11px] text-muted-foreground">
              {[store.city, store.country].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <StatusPill status={store.pipeline_status} />
        </div>

        {saved && (
          <p className="font-technical mb-4 rounded-xl border border-success/30 bg-success-tint px-4 py-2.5 text-[12px] text-success">
            SALVATO
          </p>
        )}
        {saveError && (
          <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {saveError}
          </p>
        )}

        {/* Score hero */}
        <div className="mb-6 flex items-center gap-6 rounded-[20px] border border-border bg-card p-6">
          <ScoreRing score={store.score_total} />
          <div className="flex-1">
            {store.score_total !== null ? (
              <>
                <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-2">
                  <SubScoreBar label="Stile" score={store.score_style} />
                  <SubScoreBar label="Prezzo" score={store.score_price} />
                  <SubScoreBar label="Mercato" score={store.score_market} />
                  <SubScoreBar label="Instagram" score={store.score_instagram} />
                </div>
                {store.score_rationale && (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {store.score_rationale}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun punteggio calcolato ancora.</p>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <form action={runScoreStoreWithId}>
            <Button type="submit" variant="outline">
              {store.score_total !== null ? "Ricalcola punteggio" : "Calcola punteggio"}
            </Button>
          </form>
          <DraftsPanel
            drafts={drafts ?? []}
            generateAction={generateStoreDraftWithId}
            markSentAction={markStoreDraftSent}
            deleteAction={deleteStoreDraft}
          />
        </div>

        <InteractionsSection interactions={interactions ?? []} logAction={logStoreInteractionWithId} />

        <form action={updateStoreWithId} className="flex flex-col">
          <FormGroup title="Anagrafica">
            <FormRow label="Nome">
              <Input id="name" name="name" defaultValue={store.name} required className={fieldInputClass} />
            </FormRow>
            <FormRow label="Città">
              <Input id="city" name="city" defaultValue={store.city ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Paese">
              <Input id="country" name="country" defaultValue={store.country ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Indirizzo">
              <Input id="address" name="address" defaultValue={store.address ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Sito web">
              <Input id="website" name="website" defaultValue={store.website ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Instagram">
              <Input
                id="instagram_handle"
                name="instagram_handle"
                defaultValue={store.instagram_handle ?? ""}
                className={fieldInputClass}
              />
            </FormRow>
          </FormGroup>

          <FormGroup title="Contatti">
            <FormRow label="Email">
              <Input id="email" name="email" type="email" defaultValue={store.email ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Telefono">
              <Input id="phone" name="phone" defaultValue={store.phone ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Buyer / titolare">
              <Input
                id="contact_person"
                name="contact_person"
                defaultValue={store.contact_person ?? ""}
                className={fieldInputClass}
              />
            </FormRow>
          </FormGroup>

          <FormGroup title="Commerciale">
            <FormRow label="Fascia di prezzo">
              <Input
                id="estimated_price_range"
                name="estimated_price_range"
                placeholder="es. 100-300€"
                defaultValue={store.estimated_price_range ?? ""}
                className={fieldInputClass}
              />
            </FormRow>
            <FormRow label="Modello commerciale">
              <select
                id="business_model"
                name="business_model"
                defaultValue={store.business_model}
                className="h-7 rounded-md border-0 bg-transparent text-right text-[14px] focus:outline-none"
              >
                {BUSINESS_MODELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Stato pipeline">
              <select
                id="pipeline_status"
                name="pipeline_status"
                defaultValue={store.pipeline_status}
                className="h-7 rounded-md border-0 bg-transparent text-right text-[14px] focus:outline-none"
              >
                {PIPELINE_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Brand venduti" stacked>
              <Input
                id="brands_sold"
                name="brands_sold"
                placeholder="separati da virgola"
                defaultValue={(store.brands_sold ?? []).join(", ")}
              />
            </FormRow>
            <FormRow label="Stile / tag" stacked>
              <Input
                id="style_tags"
                name="style_tags"
                placeholder="separati da virgola"
                defaultValue={(store.style_tags ?? []).join(", ")}
              />
            </FormRow>
          </FormGroup>

          <FormGroup title="Note">
            <FormRow label="" stacked>
              <Textarea id="notes" name="notes" defaultValue={store.notes ?? ""} rows={4} />
            </FormRow>
          </FormGroup>

          <Button type="submit" className="w-fit">
            Salva modifiche
          </Button>
        </form>
      </div>
    </div>
  );
}
