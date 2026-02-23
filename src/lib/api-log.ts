import type { SupabaseClient } from "@supabase/supabase-js";

export type ApiLogPayload = {
  user_id: string;
  org_id?: string | null;
  endpoint: string;
  status_code: number;
  credits_consumed: number;
};

/**
 * Insert a record into api_logs (Supabase). No-op if Supabase is not configured or insert fails.
 */
export async function insertApiLog(
  supabase: SupabaseClient | null,
  payload: ApiLogPayload
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("api_logs").insert({
      user_id: payload.user_id,
      org_id: payload.org_id ?? null,
      endpoint: payload.endpoint,
      status_code: payload.status_code,
      credits_consumed: payload.credits_consumed,
    });
  } catch (err) {
    console.error("[api_logs] insert error:", err);
  }
}
