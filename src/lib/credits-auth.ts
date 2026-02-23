import { getSupabase } from "@/lib/supabase";
import {
  getCredits,
  ensureWelcomeCredits as ensureUserWelcomeCredits,
  addCredits as addUserCredits,
  deductCredits as deductUserCredits,
} from "@/lib/credits";

/**
 * Get credit balance: organizations.credit_balance if user is in an org, else Prisma user_credits.
 */
export async function getCreditsForAuth(
  userId: string,
  orgId: string | null | undefined
): Promise<number> {
  if (orgId && orgId.trim()) {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("organizations")
        .select("credit_balance")
        .eq("id", orgId)
        .single();
      if (!error && data && typeof data.credit_balance === "number") {
        return Math.max(0, data.credit_balance);
      }
      return 0;
    }
  }
  return getCredits(userId);
}

/**
 * Ensure user has welcome credits (only for individual accounts; orgs do not get welcome credits).
 */
export async function ensureWelcomeCredits(
  userId: string,
  orgId: string | null | undefined
): Promise<number> {
  if (orgId && orgId.trim()) {
    return getCreditsForAuth(userId, orgId);
  }
  return ensureUserWelcomeCredits(userId);
}

/**
 * Deduct credits: from organizations.credit_balance if org, else from Prisma user_credits.
 */
export async function deductCreditsForAuth(
  userId: string,
  amount: number,
  orgId: string | null | undefined
): Promise<{ ok: boolean; remaining: number }> {
  const a = Math.max(0, Math.round(amount));
  if (a === 0) {
    const current = await getCreditsForAuth(userId, orgId);
    return { ok: true, remaining: current };
  }

  if (orgId && orgId.trim()) {
    const supabase = getSupabase();
    if (supabase) {
      const { data: row, error: fetchErr } = await supabase
        .from("organizations")
        .select("credit_balance")
        .eq("id", orgId)
        .single();
      if (fetchErr || !row) return { ok: false, remaining: 0 };
      const current = typeof row.credit_balance === "number" ? row.credit_balance : 0;
      if (current < a) return { ok: false, remaining: current };
      const { data: updated, error: updateErr } = await supabase
        .from("organizations")
        .update({ credit_balance: current - a, updated_at: new Date().toISOString() })
        .eq("id", orgId)
        .select("credit_balance")
        .single();
      if (updateErr || !updated) return { ok: false, remaining: current };
      const remaining = typeof updated.credit_balance === "number" ? updated.credit_balance : 0;
      return { ok: true, remaining };
    }
  }

  return deductUserCredits(userId, a);
}

/**
 * Add credits: to organizations.credit_balance if org, else to Prisma user_credits.
 */
export async function addCreditsForAuth(
  userId: string,
  amount: number,
  orgId: string | null | undefined
): Promise<number> {
  const a = Math.max(0, Math.round(amount));
  if (a === 0) return getCreditsForAuth(userId, orgId);

  if (orgId && orgId.trim()) {
    const supabase = getSupabase();
    if (supabase) {
      const { data: row } = await supabase
        .from("organizations")
        .select("credit_balance")
        .eq("id", orgId)
        .single();
      const current = row && typeof row.credit_balance === "number" ? row.credit_balance : 0;
      const newBalance = current + a;
      if (row) {
        await supabase
          .from("organizations")
          .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", orgId);
      } else {
        await supabase.from("organizations").insert({
          id: orgId,
          credit_balance: newBalance,
          updated_at: new Date().toISOString(),
        });
      }
      return newBalance;
    }
  }

  return addUserCredits(userId, a);
}
