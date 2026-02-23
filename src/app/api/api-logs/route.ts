import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export type ApiLogEntry = {
  id?: string;
  endpoint: string;
  status_code: number;
  credits_consumed: number;
  created_at: string;
};

/**
 * GET: return api_logs for the current user (and their active org) for the Security Log dashboard section.
 */
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ logs: [] });
  }

  try {
    let query = supabase
      .from("api_logs")
      .select("id, endpoint, status_code, credits_consumed, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205" || /relation.*does not exist/i.test(error.message)) {
        return NextResponse.json({ logs: [] });
      }
      console.error("[api-logs] list error:", error);
      return NextResponse.json({ logs: [] });
    }

    const logsList: ApiLogEntry[] = (data ?? []).map((r) => ({
      id: r.id,
      endpoint: r.endpoint ?? "/api/extract",
      status_code: typeof r.status_code === "number" ? r.status_code : 0,
      credits_consumed: typeof r.credits_consumed === "number" ? r.credits_consumed : 0,
      created_at: r.created_at ?? new Date().toISOString(),
    }));

    return NextResponse.json({ logs: logsList });
  } catch (err) {
    console.error("[api-logs] error:", err);
    return NextResponse.json({ logs: [] });
  }
}
