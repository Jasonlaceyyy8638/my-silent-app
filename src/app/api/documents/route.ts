import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import type { ExtractedRow } from "@/types";

/**
 * GET: return saved extractions for the current user so the dashboard can show
 * Total Documents Architected / Line Items / Hours Saved after refresh.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ rows: [], usage: [] });
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("extracted_data, file_name, created_at, page_count, credit_cost")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        return NextResponse.json({ rows: [], usage: [] });
      }
      console.error("[documents] list error:", error);
      return NextResponse.json({ rows: [], usage: [] });
    }

    const raw = data ?? [];
    const rows: ExtractedRow[] = raw
      .map((r) => r.extracted_data as ExtractedRow | null)
      .filter((r): r is ExtractedRow => r != null && typeof r === "object");

    const usage = raw.map((r) => ({
      file_name: r.file_name ?? "Document",
      date_processed: r.created_at ?? new Date().toISOString(),
      credits_used: typeof r.credit_cost === "number" ? r.credit_cost : 1,
    }));

    return NextResponse.json({ rows, usage });
  } catch (err) {
    console.error("[documents] error:", err);
    return NextResponse.json({ rows: [], usage: [] });
  }
}
