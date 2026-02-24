import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export type PlanChangeEntry = {
  id: string;
  user_id: string;
  customer_email: string | null;
  from_plan: string | null;
  to_plan: string;
  stripe_session_id: string | null;
  created_at: string;
};

/**
 * GET: return recent plan changes (pro/enterprise upgrades) for Phillip McKenzie's admin view.
 */
export async function GET(request: Request) {
  const { userId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const isAdmin = orgRole === "org:admin" || orgRole === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Only Admins can view plan changes", changes: [] }, { status: 403 });
  }

  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 50, 100);
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ changes: [] });
  }

  try {
    const { data, error } = await supabase
      .from("plan_change_log")
      .select("id, user_id, customer_email, from_plan, to_plan, stripe_session_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (/relation.*does not exist/i.test(error.message)) {
        return NextResponse.json({ changes: [] });
      }
      console.error("[admin/plan-changes]", error);
      return NextResponse.json({ error: "Failed to load plan changes", changes: [] }, { status: 500 });
    }

    const changes: PlanChangeEntry[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      user_id: String(row.user_id ?? ""),
      customer_email: row.customer_email != null ? String(row.customer_email) : null,
      from_plan: row.from_plan != null ? String(row.from_plan) : null,
      to_plan: String(row.to_plan ?? ""),
      stripe_session_id: row.stripe_session_id != null ? String(row.stripe_session_id) : null,
      created_at: String(row.created_at ?? ""),
    }));

    return NextResponse.json({ changes });
  } catch (err) {
    console.error("[admin/plan-changes]", err);
    return NextResponse.json({ error: "Failed to load plan changes", changes: [] }, { status: 500 });
  }
}
