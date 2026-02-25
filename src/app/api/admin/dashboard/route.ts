import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin-auth";

export type AdminProfile = {
  user_id: string;
  email: string | null;
  plan_type: string;
  credits_remaining: number | null;
  auth_provider: string | null;
};

export type AdminReview = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  reviewer_name: string | null;
  is_published: boolean;
  created_at: string;
};

/**
 * GET /api/admin/dashboard
 * Returns all profiles and all reviews. Only allowed for primary admin (ADMIN_EMAIL).
 */
export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured", profiles: [], reviews: [] },
      { status: 503 }
    );
  }

  try {
    const [profilesRes, reviewsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, email, plan_type, credits_remaining, auth_provider")
        .order("email"),
      supabase
        .from("reviews")
        .select("id, user_id, rating, comment, reviewer_name, is_published, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (profilesRes.error) {
      console.error("[admin/dashboard] profiles error:", profilesRes.error);
      return NextResponse.json(
        { error: "Failed to load profiles", profiles: [], reviews: [] },
        { status: 500 }
      );
    }
    if (reviewsRes.error) {
      console.error("[admin/dashboard] reviews error:", reviewsRes.error);
      return NextResponse.json(
        { error: "Failed to load reviews", profiles: [], reviews: [] },
        { status: 500 }
      );
    }

    const profiles: AdminProfile[] = (profilesRes.data ?? []).map(
      (row: {
        user_id?: string;
        email?: string | null;
        plan_type?: string;
        credits_remaining?: number | null;
        auth_provider?: string | null;
      }) => ({
        user_id: row.user_id ?? "",
        email: row.email ?? null,
        plan_type: row.plan_type ?? "free",
        credits_remaining: row.credits_remaining ?? null,
        auth_provider: row.auth_provider ?? null,
      })
    );

    const reviews: AdminReview[] = (reviewsRes.data ?? []).map(
      (row: {
        id?: string;
        user_id?: string;
        rating?: number;
        comment?: string;
        reviewer_name?: string | null;
        is_published?: boolean;
        created_at?: string;
      }) => ({
        id: row.id ?? "",
        user_id: row.user_id ?? "",
        rating: Number(row.rating) || 0,
        comment: row.comment ?? "",
        reviewer_name: row.reviewer_name ?? null,
        is_published: Boolean(row.is_published),
        created_at: row.created_at ?? new Date().toISOString(),
      })
    );

    return NextResponse.json({ profiles, reviews });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json(
      { error: "Failed to load dashboard", profiles: [], reviews: [] },
      { status: 500 }
    );
  }
}
