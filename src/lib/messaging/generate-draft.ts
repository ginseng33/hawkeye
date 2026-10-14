import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
import { BRAND_BRIEF } from "@/lib/brand-config";
import { assertBudgetAvailable, logApiUsage } from "@/lib/budget";

const MODEL = "claude-sonnet-5";
const INPUT_COST_PER_TOKEN = 2 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 10 / 1_000_000;

const ITALIAN_SPEAKING_COUNTRIES = ["italia", "italy"];

export type DraftPartner =
  | {
      type: "store";
      id: string;
      name: string;
      city: string | null;
      country: string | null;
      contact_person: string | null;
      brands_sold: string[];
      score_rationale: string | null;
    }
  | {
      type: "creator";
      id: string;
      handle: string;
      full_name: string | null;
      follower_count: number | null;
      score_rationale: string | null;
    };

export async function generateMessageDraft(
  supabase: SupabaseClient,
  partner: DraftPartner,
  channel: "email" | "dm",
  variantLabel: string
): Promise<string> {
  await assertBudgetAvailable(supabase, "anthropic");

  const client = new Anthropic({
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
      : undefined,
  });

  const language =
    partner.type === "store" && ITALIAN_SPEAKING_COUNTRIES.includes((partner.country ?? "").toLowerCase())
      ? "italiano"
      : "inglese";

  const partnerDescription =
    partner.type === "store"
      ? `Negozio: ${partner.name}, ${partner.city ?? "?"}, ${partner.country ?? "?"}.
Contatto/buyer: ${partner.contact_person ?? "sconosciuto, usa un saluto generico"}.
Brand già venduti: ${partner.brands_sold.length ? partner.brands_sold.join(", ") : "non noti"}.
Perché è un buon fit: ${partner.score_rationale ?? "affinità stilistica generale"}.`
      : `Micro-influencer: @${partner.handle} (${partner.full_name ?? "nome non noto"}), ${partner.follower_count ?? "?"} follower.
Perché è un buon fit: ${partner.score_rationale ?? "affinità estetica generale"}.`;

  const channelInstructions =
    channel === "email"
      ? "Scrivi una email di primo contatto: oggetto breve + corpo del messaggio. Tono professionale ma umano, non corporate."
      : "Scrivi un messaggio diretto (DM Instagram): breve, informale ma rispettoso, senza oggetto.";

  const userPrompt = `
${partnerDescription}

Canale: ${channel}. Variante richiesta: "${variantLabel}" (adatta leggermente tono/apertura a questa indicazione, mantenendo il messaggio coerente).
Lingua: scrivi in ${language}.

${channelInstructions}

Regole:
- Breve (max 120 parole per il corpo), diretto, senza elogi esagerati o linguaggio da marketing
- Rifletti il posizionamento del brand: essenziale, senza fronzoli, nessuna promessa di sconti o volumi
- Proponi un prossimo passo concreto (es. invio lookbook, campione, call breve) ma senza essere pressante
- Non inventare dettagli sul negozio/creator che non sono stati forniti
- Non aggiungere firma finale con nome proprio: chiudi con "Il team Sixtyonelabs" o simile
`.trim();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: [
      {
        type: "text",
        text: `Scrivi bozze di messaggi di primo contatto per conto di questo brand di moda indipendente, secondo il suo brief e la sua voce.\n\n${BRAND_BRIEF}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  const body = textBlock?.text.trim() ?? "";

  const cost =
    response.usage.input_tokens * INPUT_COST_PER_TOKEN +
    response.usage.output_tokens * OUTPUT_COST_PER_TOKEN;

  await logApiUsage(supabase, "anthropic", "generate_message_draft", cost, {
    partner_type: partner.type,
    partner_id: partner.id,
    channel,
    model: MODEL,
  });

  return body;
}
