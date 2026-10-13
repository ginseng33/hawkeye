import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
import { BRAND_BRIEF } from "@/lib/brand-config";
import { assertBudgetAvailable, logApiUsage } from "@/lib/budget";
import { scoreStore } from "@/lib/scoring/score-store";

const MODEL = "claude-sonnet-5";
const INPUT_COST_PER_TOKEN = 2 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 10 / 1_000_000;
const COST_PER_WEB_SEARCH = 0.01;
export const SCORE_THRESHOLD = 75;

type Candidate = {
  name: string;
  city: string;
  country: string;
  website: string | null;
  instagram_handle: string | null;
  brands_sold: string[];
  notes: string;
};

const SUBMIT_CANDIDATES_TOOL: Anthropic.Tool = {
  name: "submit_candidates",
  description:
    "Submit the final list of candidate stores found via web research, with their basic info.",
  input_schema: {
    type: "object",
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            city: { type: "string" },
            country: { type: "string" },
            website: { type: ["string", "null"] },
            instagram_handle: { type: ["string", "null"] },
            brands_sold: {
              type: "array",
              items: { type: "string" },
              description: "Brand noti venduti dal negozio, se emersi dalla ricerca",
            },
            notes: {
              type: "string",
              description: "Perché questo negozio è un candidato plausibile (fonti/evidenze trovate)",
            },
          },
          required: ["name", "city", "country", "website", "instagram_handle", "brands_sold", "notes"],
        },
      },
    },
    required: ["candidates"],
  },
};

export type DiscoveryResult = {
  kept: { name: string; city: string; score: number }[];
  rejected: { name: string; city: string; score: number }[];
  searchesUsed: number;
  costUsd: number;
};

export async function discoverStores(
  supabase: SupabaseClient,
  params: { city: string; country?: string; keyword?: string; maxResults: number; maxSearches: number }
): Promise<DiscoveryResult> {
  await assertBudgetAvailable(supabase, "anthropic");

  const client = new Anthropic({
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
      : undefined,
  });

  const userPrompt = `
Cerca sul web negozi/boutique/concept store REALI ed ESISTENTI a ${params.city}${params.country ? ", " + params.country : ""}
${params.keyword ? `con focus su: ${params.keyword}` : ""}
che potrebbero vendere o essere affini ai brand di riferimento elencati nel brief (Our Legacy, Auralee, Kapital, Acne Studios linea denim, Evan Kinori) o con estetica compatibile (denim di qualità, capsule indipendenti, estetica sobria/giapponese, no fast fashion, no grandi catene).

Usa ricerche tipo: "<brand affine> stockists ${params.city}", "concept store denim ${params.city}", directory di boutique indipendenti.
Trova al massimo ${params.maxResults} candidati, solo quelli con evidenza concreta di affinità (non inventare negozi).
Quando hai finito, chiama submit_candidates con la lista finale (anche vuota se non trovi nulla di valido).
`.trim();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: `Sei un ricercatore che trova negozi wholesale potenziali per un brand di moda indipendente, secondo questo brief.\n\n${BRAND_BRIEF}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: params.maxSearches,
      },
      SUBMIT_CANDIDATES_TOOL,
    ],
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const searchesUsed = response.content.filter(
    (b) => b.type === "web_search_tool_result"
  ).length;

  const submitBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_candidates"
  );
  const candidates: Candidate[] = submitBlock
    ? (submitBlock.input as { candidates: Candidate[] }).candidates
    : [];

  const tokenCost =
    response.usage.input_tokens * INPUT_COST_PER_TOKEN +
    response.usage.output_tokens * OUTPUT_COST_PER_TOKEN;
  const searchCost = searchesUsed * COST_PER_WEB_SEARCH;
  const totalDiscoveryCost = tokenCost + searchCost;

  await logApiUsage(supabase, "anthropic", "discover_stores", totalDiscoveryCost, {
    model: MODEL,
    city: params.city,
    searches_used: searchesUsed,
    candidates_found: candidates.length,
  });

  const kept: DiscoveryResult["kept"] = [];
  const rejected: DiscoveryResult["rejected"] = [];
  let scoringCost = 0;

  for (const candidate of candidates) {
    // Dedupe: skip if a store with the same name+city or same instagram already exists.
    const { data: existing } = await supabase
      .from("stores")
      .select("id")
      .or(
        `and(name.ilike.${candidate.name},city.ilike.${candidate.city})` +
          (candidate.instagram_handle ? `,instagram_handle.eq.${candidate.instagram_handle}` : "")
      )
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { data: inserted, error: insertError } = await supabase
      .from("stores")
      .insert({
        name: candidate.name,
        city: candidate.city,
        country: candidate.country,
        website: candidate.website,
        instagram_handle: candidate.instagram_handle,
        brands_sold: candidate.brands_sold,
        source: "web_search",
        notes: candidate.notes,
        pipeline_status: "new",
      })
      .select(
        "id, name, city, country, website, instagram_handle, brands_sold, style_tags, estimated_price_range, notes"
      )
      .single();

    if (insertError || !inserted) continue;

    const scoreResult = await scoreStore(supabase, inserted);
    scoringCost += 0; // scoreStore logs its own api_usage row

    if (scoreResult.score_total >= SCORE_THRESHOLD) {
      await supabase
        .from("stores")
        .update({
          score_style: scoreResult.score_style,
          score_price: scoreResult.score_price,
          score_market: scoreResult.score_market,
          score_instagram: scoreResult.score_instagram,
          score_total: scoreResult.score_total,
          score_rationale: scoreResult.score_rationale,
          market_tier: scoreResult.market_tier,
        })
        .eq("id", inserted.id);
      kept.push({ name: candidate.name, city: candidate.city, score: scoreResult.score_total });
    } else {
      // Below threshold: don't keep it in the pipeline.
      await supabase.from("stores").delete().eq("id", inserted.id);
      rejected.push({ name: candidate.name, city: candidate.city, score: scoreResult.score_total });
    }
  }

  return {
    kept,
    rejected,
    searchesUsed,
    costUsd: totalDiscoveryCost + scoringCost,
  };
}
