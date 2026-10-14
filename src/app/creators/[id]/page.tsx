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

const fieldInputClass =
  "h-7 border-0 bg-transparent p-0 text-right text-[14px] shadow-none focus-visible:ring-0";

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
      <TopBar />
      <CommandPalette />
      <div className="mx-auto max-w-[720px] px-6 py-8">
        <Link
          href="/creators"
          className="font-technical mb-4 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          INFLUENCER
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-[32px] leading-tight text-foreground">@{creator.handle}</h1>
            <p className="font-technical mt-1 text-[11px] text-muted-foreground">
              {creator.full_name ?? "—"} · {(creator.follower_count ?? 0).toLocaleString("it-IT")} FOLLOWER
            </p>
          </div>
          <StatusPill status={creator.pipeline_status} />
        </div>

        {saved && (
          <p className="font-technical mb-4 rounded-xl border border-success/30 bg-success-tint px-4 py-2.5 text-[12px] text-success">
            SALVATO
          </p>
        )}

        <div className="mb-6 flex items-center gap-6 rounded-[20px] border border-border bg-card p-6">
          <ScoreRing score={creator.score_total} />
          <div className="flex-1">
            {creator.score_total !== null ? (
              <>
                <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-2">
                  <SubScoreBar label="Estetica" score={creator.score_aesthetic} />
                  <SubScoreBar label={`Engagement (${creator.engagement_rate}%)`} score={creator.score_engagement} />
                  <SubScoreBar label="Autenticità" score={creator.score_authenticity} />
                  <SubScoreBar label="Qualità contenuti" score={creator.score_content_quality} />
                </div>
                {creator.score_rationale && (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {creator.score_rationale}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun punteggio (profilo aggiunto manualmente).
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <DraftsPanel
            drafts={drafts ?? []}
            generateAction={generateCreatorDraftWithId}
            markSentAction={markCreatorDraftSent}
            deleteAction={deleteCreatorDraft}
          />
        </div>

        <InteractionsSection interactions={interactions ?? []} logAction={logCreatorInteractionWithId} />

        <form action={updateCreatorWithId} className="flex flex-col">
          <FormGroup title="Anagrafica">
            <FormRow label="Nome">
              <Input id="full_name" name="full_name" defaultValue={creator.full_name ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Città">
              <Input id="city" name="city" defaultValue={creator.city ?? ""} className={fieldInputClass} />
            </FormRow>
            <FormRow label="Follower">
              <Input
                id="follower_count"
                name="follower_count"
                type="number"
                defaultValue={creator.follower_count ?? ""}
                className={fieldInputClass}
              />
            </FormRow>
            <FormRow label="Stato pipeline">
              <select
                id="pipeline_status"
                name="pipeline_status"
                defaultValue={creator.pipeline_status}
                className="h-7 rounded-md border-0 bg-transparent text-right text-[14px] focus:outline-none"
              >
                {PIPELINE_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Tag estetici" stacked>
              <Input
                id="aesthetic_tags"
                name="aesthetic_tags"
                placeholder="separati da virgola"
                defaultValue={(creator.aesthetic_tags ?? []).join(", ")}
              />
            </FormRow>
          </FormGroup>

          <FormGroup title="Note / bio">
            <FormRow label="" stacked>
              <Textarea id="notes" name="notes" defaultValue={creator.notes ?? ""} rows={4} />
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
