import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export type TeamUsageEntry = {
  user_id: string;
  credits_used: number;
};

/**
 * GET: return per-user credit usage for the current org this month.
 * Requires active organization context.
 */
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json(
      { error: "Select an organization to view team usage", usage: [] },
      { status: 200 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ usage: [] });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startIso = startOfMonth.toISOString();

  try {
    const { data, error } = await supabase
      .from("api_logs")
      .select("user_id, credits_consumed")
      .eq("org_id", orgId)
      .gte("created_at", startIso)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || /relation.*does not exist/i.test(error.message)) {
        return NextResponse.json({ usage: [] });
      }
      console.error("[team-usage] list error:", error);
      return NextResponse.json({ usage: [] });
    }

    const byUser = new Map<string, number>();
    for (const row of data ?? []) {
      const uid = row.user_id ?? "";
      const credits = typeof row.credits_consumed === "number" ? row.credits_consumed : 0;
      byUser.set(uid, (byUser.get(uid) ?? 0) + credits);
    }

    const usage: TeamUsageEntry[] = Array.from(byUser.entries()).map(([user_id, credits_used]) => ({
      user_id,
      credits_used,
    }));

    usage.sort((a, b) => b.credits_used - a.credits_used);
    return NextResponse.json({ usage });
  } catch (err) {
    console.error("[team-usage] error:", err);
    return NextResponse.json({ usage: [] });
  }
}
