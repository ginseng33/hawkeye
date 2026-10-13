import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
import { BRAND_BRIEF, marketScoreFor, marketTierFor } from "@/lib/brand-config";
import { assertBudgetAvailable, logApiUsage } from "@/lib/budget";

const MODEL = "claude-sonnet-5";
// Sonnet 5 pricing: $2 / $10 per 1M input / output tokens.
const INPUT_COST_PER_TOKEN = 2 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 10 / 1_000_000;

type StoreRow = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  website: string | null;
  instagram_handle: string | null;
  brands_sold: string[];
  style_tags: string[];
  estimated_price_range: string | null;
  notes: string | null;
};

type AiSubScores = {
  score_style: number;
  score_price: number;
  score_instagram: number;
  rationale: string;
};

const SUBMIT_SCORE_TOOL: Anthropic.Tool = {
  name: "submit_score",
  description: "Submit the affinity sub-scores for this store.",
  input_schema: {
    type: "object",
    properties: {
      score_style: {
        type: "number",
        description: "0-100: coerenza stilistica ed estetica con il brand e i brand affini elencati",
      },
      score_price: {
        type: "number",
        description: "0-100: coerenza tra la fascia di prezzo del negozio e quella del brand",
      },
      score_instagram: {
        type: "number",
        description: "0-100: qualità/presenza della comunicazione Instagram (solo dai dati disponibili)",
      },
      rationale: {
        type: "string",
        description: "2-4 frasi in italiano che spiegano i punteggi assegnati, citando i dati usati",
      },
    },
    required: ["score_style", "score_price", "score_instagram", "rationale"],
  },
};

async function getWeights(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("scoring_weights")
    .select("criterion, weight")
    .eq("entity_type", "store");

  const weights = Object.fromEntries((data ?? []).map((r) => [r.criterion, Number(r.weight)]));
  return {
    style: weights.style_and_brands ?? 0.4,
    price: weights.price_coherence ?? 0.25,
    market: weights.market_fit ?? 0.2,
    instagram: weights.instagram_quality ?? 0.15,
  };
}

export async function scoreStore(supabase: SupabaseClient, store: StoreRow) {
  await assertBudgetAvailable(supabase, "anthropic");

  const weights = await getWeights(supabase);
  const tier = marketTierFor(store.country, store.city);
  const scoreMarket = marketScoreFor(tier);

  const client = new Anthropic({
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
      : undefined,
  });

  const userPrompt = `
Valuta questo negozio come possibile partner wholesale/conto vendita per il brand descritto sopra.

Negozio: ${store.name}
Città/Paese: ${store.city ?? "?"}, ${store.country ?? "?"}
Sito: ${store.website ?? "non disponibile"}
Instagram: ${store.instagram_handle ?? "non disponibile"}
Brand venduti (se noti): ${store.brands_sold.length ? store.brands_sold.join(", ") : "non specificati"}
Tag di stile (se noti): ${store.style_tags.length ? store.style_tags.join(", ") : "non specificati"}
Fascia di prezzo stimata (se nota): ${store.estimated_price_range ?? "non specificata"}
Note: ${store.notes ?? "nessuna"}

Se i dati sono insufficienti per un criterio, assegna un punteggio prudente (intorno a 50) e dillo nella motivazione invece di inventare informazioni.
`.trim();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `Sei un assistente che valuta l'affinità tra negozi wholesale e un brand di moda indipendente, secondo il brief seguente.\n\n${BRAND_BRIEF}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [SUBMIT_SCORE_TOOL],
    tool_choice: { type: "tool", name: "submit_score" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude non ha restituito un punteggio valido.");
  }

  const ai = toolUse.input as AiSubScores;

  const scoreTotal =
    ai.score_style * weights.style +
    ai.score_price * weights.price +
    scoreMarket * weights.market +
    ai.score_instagram * weights.instagram;

  const cost =
    response.usage.input_tokens * INPUT_COST_PER_TOKEN +
    response.usage.output_tokens * OUTPUT_COST_PER_TOKEN;

  await logApiUsage(supabase, "anthropic", "score_store", cost, {
    store_id: store.id,
    model: MODEL,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  });

  return {
    score_style: ai.score_style,
    score_price: ai.score_price,
    score_market: scoreMarket,
    score_instagram: ai.score_instagram,
    score_total: Math.round(scoreTotal * 10) / 10,
    score_rationale: `${ai.rationale} (Mercato: tier ${tier} → ${scoreMarket}/100, regola fissa non valutata dall'AI.)`,
    market_tier: tier,
  };
}
