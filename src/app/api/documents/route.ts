import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { ExtractedRow } from "@/types";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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
    return NextResponse.json({ rows: [] });
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("extracted_data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        return NextResponse.json({ rows: [] });
      }
      console.error("[documents] list error:", error);
      return NextResponse.json({ rows: [] });
    }

    const rows: ExtractedRow[] = (data ?? [])
      .map((r) => r.extracted_data as ExtractedRow | null)
      .filter((r): r is ExtractedRow => r != null && typeof r === "object");

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[documents] error:", err);
    return NextResponse.json({ rows: [] });
  }
}
