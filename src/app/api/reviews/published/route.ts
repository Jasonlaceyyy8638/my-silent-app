import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export type PublishedReviewEntry = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  reviewer_name: string | null;
  sync_count: number;
  created_at: string;
};

/**
 * GET /api/reviews/published
 * Returns the latest 3 published reviews with reviewer display name and sync count for social proof.
 */
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ reviews: [] });
  }

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, user_id, rating, comment, reviewer_name, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[reviews/published] error:", error);
    return NextResponse.json({ reviews: [] });
  }

  const reviews: PublishedReviewEntry[] = [];
  for (const row of rows ?? []) {
    const userId = (row as { user_id?: string }).user_id ?? "";
    let syncCount = 0;
    const { count } = await supabase
      .from("sync_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    syncCount = count ?? 0;

    const displayName =
      (row as { reviewer_name?: string | null }).reviewer_name?.trim() || "VeloDoc Professional";

    reviews.push({
      id: (row as { id?: string }).id ?? "",
      user_id: userId,
      rating: Number((row as { rating?: number }).rating) || 5,
      comment: (row as { comment?: string }).comment ?? "",
      reviewer_name: displayName,
      sync_count: syncCount,
      created_at: (row as { created_at?: string }).created_at ?? new Date().toISOString(),
    });
  }

  return NextResponse.json({ reviews });
}
