import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin-auth";

/**
 * PATCH /api/admin/reviews/[id]
 * Body: { is_published: boolean }
 * Only allowed for primary admin (ADMIN_EMAIL). Updates reviews.is_published in Supabase.
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Review id required" }, { status: 400 });
  }

  let body: { is_published?: boolean };
  try {
    body = await _req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isPublished =
    typeof body.is_published === "boolean" ? body.is_published : undefined;
  if (isPublished === undefined) {
    return NextResponse.json(
      { error: "is_published (boolean) required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .update({ is_published: isPublished })
    .eq("id", id)
    .select("id, is_published")
    .single();

  if (error) {
    console.error("[admin/reviews] update error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, review: data });
}
