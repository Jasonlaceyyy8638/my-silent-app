import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

export type UserTierEntry = {
  user_id: string;
  email: string | null;
  plan_type: string;
  auth_provider: string | null;
};

/**
 * GET: return all profiles with user_id, email, plan_type for admin visibility.
 * Phillip McKenzie (and any org admin) can see which tier each user is on in the master admin view.
 * Connection audit: no user_id filter — intentional; uses getSupabase() (service role) so RLS allows admin list.
 */
export async function GET() {
  const { userId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const isAdmin = orgRole === "org:admin" || orgRole === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Only Admins can view user tiers", tiers: [] }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ tiers: [] });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, email, plan_type, auth_provider")
      .order("user_id");

    if (error) {
      if (/relation.*does not exist/i.test(error.message)) {
        return NextResponse.json({ tiers: [] });
      }
      console.error("[admin/user-tiers]", error);
      return NextResponse.json({ error: "Failed to load user tiers", tiers: [] }, { status: 500 });
    }

    const tiers: UserTierEntry[] = (data ?? []).map((row: { user_id?: string; email?: string | null; plan_type?: string; auth_provider?: string | null }) => ({
      user_id: row.user_id ?? "",
      email: row.email ?? null,
      plan_type: row.plan_type ?? "starter",
      auth_provider: row.auth_provider ?? null,
    }));

    return NextResponse.json({ tiers });
  } catch (err) {
    console.error("[admin/user-tiers]", err);
    return NextResponse.json({ error: "Failed to load user tiers", tiers: [] }, { status: 500 });
  }
}
