import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/reviews
 * Submit a review (from /review/[id] form). Body: { user_id, rating, comment, reviewer_name? }
 * Inserts into reviews (is_published = false by default). Sets profiles.review_request_sent = true.
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let body: { user_id?: string; rating?: number; comment?: string; reviewer_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const user_id = body.user_id?.trim();
  const rating = body.rating != null ? Number(body.rating) : NaN;
  const comment = body.comment?.trim() ?? "";
  const reviewer_name = body.reviewer_name?.trim() || null;

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  if (comment.length < 10) {
    return NextResponse.json({ error: "comment must be at least 10 characters" }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from("reviews").insert({
    user_id,
    rating,
    comment,
    reviewer_name,
    is_published: false,
  });
  if (insertErr) {
    console.error("[reviews] insert error:", insertErr);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ review_request_sent: true })
    .eq("user_id", user_id);

  return NextResponse.json({ ok: true, message: "Thank you for your review." });
}
