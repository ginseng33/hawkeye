// SIXTYONELABS brand brief — used as grounding context for AI scoring.
// Edit this file if the brand positioning or reference points change.
export const BRAND_BRIEF = `
Brand: Sixtyonelabs (sixtyonelabs.com), brand indipendente fondato a Roma nel 2025.
Stile: denim-centric contemporary, unisex, con riferimenti giapponesi (linea "Yanaka", denim selvedge)
e lavaggi artigianali (light, dirt, sand, aged black, bronzed). Silhouette bootcut e boxy,
palette terrosa (indigo, sabbia, marrone, grigio fango, borgogna).
Posizionamento: "Made in Italy dal linguaggio giapponese, avanguardia sui trattamenti ed essenziale
allo stesso tempo e senza logo". Produzione Made in Italy, piccoli drop, pochi capi l'anno.

Fascia di prezzo retail: core €180-300 (t-shirt €80, long sleeve €100, zip hoodie €180,
jeans €240-300, giacca denim €300, giacca in pelle €600, weekend bag €450). Contemporary/premium indipendente.

Brand affini (riferimento estetico e di posizionamento): Our Legacy, Auralee, Kapital,
Acne Studios (linea denim), Evan Kinori. Negozi target vendono denim di qualità, capsule
indipendenti, estetica sobria o giapponese — non fast fashion, non luxury logo-driven.

Pubblico: uomo e donna, 22-38 anni, ambiti creativi/professionali urbani, comprano poco ma bene,
conoscono il denim (selvedge, lavaggi), frequentano concept store e vintage/archive.
`.trim();

export type MarketTier = 1 | 2 | 3 | 4 | 5;

const TIER_1_COUNTRIES = ["italia", "italy"];
const TIER_1_CITIES = ["milano", "roma", "lecce", "padova", "verona", "salerno", "carpi"];
const TIER_2_COUNTRIES = ["germania", "germany", "francia", "france"];
const TIER_3_COUNTRIES = ["danimarca", "denmark", "paesi bassi", "netherlands", "olanda"];
const TIER_4_COUNTRIES = ["giappone", "japan"];

export function marketTierFor(country?: string | null, city?: string | null): MarketTier {
  const c = country?.trim().toLowerCase() ?? "";
  const ci = city?.trim().toLowerCase() ?? "";

  if (TIER_1_COUNTRIES.includes(c)) return 1;
  if (TIER_1_CITIES.includes(ci)) return 1;
  if (TIER_2_COUNTRIES.includes(c)) return 2;
  if (TIER_3_COUNTRIES.includes(c)) return 3;
  if (TIER_4_COUNTRIES.includes(c)) return 4;
  return 5;
}

// Market fit is rule-based (not AI-judged): tier 1 = highest priority market.
export function marketScoreFor(tier: MarketTier): number {
  return { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 }[tier];
}
