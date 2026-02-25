/**
 * Hybrid Billing: credits in Supabase profiles.
 * - credits_allowance_remaining: monthly allowance (consumed first).
 * - credits_topup_remaining: purchased top-ups (consumed after allowance is zero).
 * - credits_remaining: total (allowance + topup), kept in sync.
 */
import { getSupabase } from "@/lib/supabase";
import { trySendLowCreditAlert } from "@/lib/low-credit-alert";

export async function getCreditsFromSupabase(userId: string): Promise<number | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || data == null) return null;
  const v = (data as { credits_remaining?: number | null }).credits_remaining;
  return typeof v === "number" && !Number.isNaN(v) ? Math.max(0, Math.floor(v)) : null;
}

/**
 * Deduct from allowance first, then from top-up. Updates credits_remaining to match.
 */
export async function deductCreditsFromSupabase(
  userId: string,
  amount: number
): Promise<{ ok: boolean; remaining: number }> {
  const a = Math.max(0, Math.round(amount));
  const supabase = getSupabase();
  if (!supabase || a === 0) {
    const current = await getCreditsFromSupabase(userId);
    return { ok: true, remaining: current ?? 0 };
  }

  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("credits_allowance_remaining, credits_topup_remaining, credits_remaining")
    .eq("user_id", userId)
    .single();

  if (fetchErr || !profile) return { ok: false, remaining: 0 };

  const allowance = Math.max(0, Math.floor((profile as { credits_allowance_remaining?: number }).credits_allowance_remaining ?? 0));
  const topup = Math.max(0, Math.floor((profile as { credits_topup_remaining?: number }).credits_topup_remaining ?? 0));
  const total = allowance + topup;
  if (total < a) return { ok: false, remaining: total };

  let newAllowance: number;
  let newTopup: number;
  if (allowance >= a) {
    newAllowance = allowance - a;
    newTopup = topup;
  } else {
    newAllowance = 0;
    newTopup = topup - (a - allowance);
  }
  const newTotal = newAllowance + newTopup;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      credits_allowance_remaining: newAllowance,
      credits_topup_remaining: newTopup,
      credits_remaining: newTotal,
    })
    .eq("user_id", userId);

  if (updateErr) return { ok: false, remaining: total };
  if (newTotal <= 5) {
    trySendLowCreditAlert(userId, newTotal).catch((err) =>
      console.error("[supabase-credits] low-credit alert failed:", err)
    );
  }
  return { ok: true, remaining: newTotal };
}

/**
 * Add to top-up bucket and to credits_remaining (for top-up purchases).
 */
export async function addCreditsToSupabase(userId: string, amount: number): Promise<number | null> {
  const a = Math.max(0, Math.round(amount));
  const supabase = getSupabase();
  if (!supabase || a === 0) return getCreditsFromSupabase(userId);

  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("credits_topup_remaining, credits_remaining")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) return null;
  const topup = Math.max(0, Math.floor((profile as { credits_topup_remaining?: number })?.credits_topup_remaining ?? 0));
  const currentTotal = Math.max(0, Math.floor((profile as { credits_remaining?: number })?.credits_remaining ?? 0));
  const newTopup = topup + a;
  const newTotal = currentTotal + a;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      credits_topup_remaining: newTopup,
      credits_remaining: newTotal,
      low_credit_alert_sent: false,
    })
    .eq("user_id", userId);

  if (updateErr) return null;
  return newTotal;
}
