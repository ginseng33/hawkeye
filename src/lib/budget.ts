import { SupabaseClient } from "@supabase/supabase-js";

export type ApiService = "anthropic" | "google_places" | "apify";

// Throws a plain Error with a user-facing message if the service's monthly
// budget is already exhausted. Call this BEFORE making a paid API call.
export async function assertBudgetAvailable(
  supabase: SupabaseClient,
  service: ApiService
) {
  const { data: limit } = await supabase
    .from("budget_limits")
    .select("monthly_limit_usd")
    .eq("service", service)
    .single();

  if (!limit) return; // no limit configured, allow

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from("api_usage")
    .select("estimated_cost_usd")
    .eq("service", service)
    .gte("created_at", startOfMonth.toISOString());

  const spent = (usage ?? []).reduce((sum, row) => sum + Number(row.estimated_cost_usd), 0);

  if (spent >= Number(limit.monthly_limit_usd)) {
    throw new Error(
      `Limite di budget mensile per ${service} raggiunto ($${spent.toFixed(2)} / $${limit.monthly_limit_usd}). Aumenta il limite in Impostazioni per continuare.`
    );
  }
}

export async function logApiUsage(
  supabase: SupabaseClient,
  service: ApiService,
  operation: string,
  estimatedCostUsd: number,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from("api_usage").insert({
    service,
    operation,
    estimated_cost_usd: estimatedCostUsd,
    metadata,
  });
}
