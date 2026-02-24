import type { SupabaseClient } from "@supabase/supabase-js";

export type ApiLogPayload = {
  user_id: string;
  org_id?: string | null;
  endpoint: string;
  status_code: number;
  credits_consumed: number;
  /** Optional: for quickbooks/sync logs. */
  document_id?: string | null;
  /** Optional: QuickBooks Bill Id on success. */
  intuit_tid?: string | null;
  /** Optional: error message on failure. */
  error_message?: string | null;
};

/**
 * Insert a record into api_logs (Supabase). No-op if Supabase is not configured or insert fails.
 * Optional columns document_id, intuit_tid, error_message can be added to api_logs for sync troubleshooting.
 */
export async function insertApiLog(
  supabase: SupabaseClient | null,
  payload: ApiLogPayload
): Promise<void> {
  if (!supabase) return;
  try {
    const row: Record<string, unknown> = {
      user_id: payload.user_id,
      org_id: payload.org_id ?? null,
      endpoint: payload.endpoint,
      status_code: payload.status_code,
      credits_consumed: payload.credits_consumed,
    };
    if (payload.document_id != null) row.document_id = payload.document_id;
    if (payload.intuit_tid != null) row.intuit_tid = payload.intuit_tid;
    if (payload.error_message != null) row.error_message = payload.error_message;
    await supabase.from("api_logs").insert(row);
  } catch (err) {
    console.error("[api_logs] insert error:", err);
  }
}
