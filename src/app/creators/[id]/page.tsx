import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/app/nav";
import { DraftsSection } from "@/components/drafts-section";
import { InteractionsSection } from "@/components/interactions-section";
import {
  deleteCreatorDraft,
  generateCreatorDraft,
  logCreatorInteraction,
  markCreatorDraftSent,
  updateCreator,
} from "./actions";

export const instant = false;

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

export default async function CreatorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const supabase = await createClient();
  const { data: creator, error } = await supabase.from("creators").select("*").eq("id", id).single();

  if (error || !creator) notFound();

  const { data: drafts } = await supabase
    .from("message_drafts")
    .select("id, channel, variant_label, body, status")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  const { data: interactions } = await supabase
    .from("interactions")
    .select("id, occurred_at, channel, interaction_type, notes")
    .eq("creator_id", creator.id)
    .order("occurred_at", { ascending: false });

  const updateCreatorWithId = updateCreator.bind(null, creator.id);
  const generateCreatorDraftWithId = generateCreatorDraft.bind(null, creator.id);
  const logCreatorInteractionWithId = logCreatorInteraction.bind(null, creator.id);

  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-2xl p-8">
        <Link href="/creators" className="text-sm text-muted-foreground hover:underline">
          ← Torna agli influencer
        </Link>
        <h1 className="mb-6 mt-2 text-2xl font-semibold">@{creator.handle}</h1>

        {saved && (
          <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">Salvato.</p>
        )}

        <div className="mb-6 rounded border p-4">
          {creator.score_total !== null ? (
            <>
              <p className="font-medium">Punteggio totale: {creator.score_total}/100</p>
              <p className="text-sm text-muted-foreground">
                Estetica {creator.score_aesthetic} · Engagement {creator.score_engagement} ({creator.engagement_rate}%) ·
                Autenticità {creator.score_authenticity} · Qualità contenuti {creator.score_content_quality}
              </p>
              {creator.score_rationale && (
                <p className="mt-2 text-sm text-muted-foreground">{creator.score_rationale}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nessun punteggio (questo profilo è stato aggiunto manualmente).
            </p>
          )}
        </div>

        <DraftsSection
          drafts={drafts ?? []}
          generateAction={generateCreatorDraftWithId}
          markSentAction={markCreatorDraftSent}
          deleteAction={deleteCreatorDraft}
        />

        <InteractionsSection interactions={interactions ?? []} logAction={logCreatorInteractionWithId} />

        <form action={updateCreatorWithId} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name">Nome</Label>
              <Input id="full_name" name="full_name" defaultValue={creator.full_name ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">Città</Label>
              <Input id="city" name="city" defaultValue={creator.city ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="follower_count">Follower</Label>
              <Input
                id="follower_count"
                name="follower_count"
                type="number"
                defaultValue={creator.follower_count ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pipeline_status">Stato pipeline</Label>
              <select
                id="pipeline_status"
                name="pipeline_status"
                defaultValue={creator.pipeline_status}
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
            <Label htmlFor="aesthetic_tags">Tag estetici (separati da virgola)</Label>
            <Input
              id="aesthetic_tags"
              name="aesthetic_tags"
              defaultValue={(creator.aesthetic_tags ?? []).join(", ")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Note / bio</Label>
            <Textarea id="notes" name="notes" defaultValue={creator.notes ?? ""} rows={4} />
          </div>

          <Button type="submit" className="w-fit">
            Salva
          </Button>
        </form>
      </div>
    </div>
  );
}
