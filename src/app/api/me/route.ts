import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureWelcomeCredits } from "@/lib/credits-auth";
import { prisma } from "@/lib/prisma";
import { getSupabase } from "@/lib/supabase";

const norm = (s: string) => s.trim().toLowerCase();

export type MeRole = "admin" | "editor" | "viewer" | null;

export type MePlan = "starter" | "pro" | "enterprise";

export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const credits = await ensureWelcomeCredits(userId, orgId);
    const url = process.env.DATABASE_URL ?? "";
    const projectRef = url.match(/prisma\.([a-zA-Z0-9]+)/)?.[1] ?? null;

    const role: MeRole =
      orgId && orgRole
        ? orgRole === "org:admin" || orgRole === "admin"
          ? "admin"
          : orgRole === "org:member" || orgRole === "member"
            ? "editor"
            : "viewer"
        : null;

    let plan: MePlan = "starter";
    const supabase = getSupabase();
    if (supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_type")
        .eq("user_id", userId)
        .maybeSingle();
      const planType = (profile as { plan_type?: string } | null)?.plan_type;
      if (planType === "pro" || planType === "enterprise") {
        plan = planType;
      }
    }

    const debug = new URL(request.url).searchParams.get("debug") === "1";
    let payload: Record<string, unknown> = {
      userId,
      orgId: orgId ?? undefined,
      role,
      plan,
      credits,
      dbHint: projectRef
        ? `App DB project ref: ${projectRef}`
        : undefined,
    };

    if (debug) {
      const all = await prisma.userCredits.findMany();
      const normalized = norm(userId);
      const matched = all.find((r) => norm(r.userId) === normalized);
      payload = {
        ...payload,
        debug: true,
        findManyCount: all.length,
        allRows: all.map((r) => ({ userId: r.userId, credits: r.credits })),
        yourUserIdNormalized: normalized,
        matchedRow: matched ? { userId: matched.userId, credits: matched.credits } : null,
      };
    }

    return NextResponse.json(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { userId, error: "Credits fetch failed", details: msg },
      { status: 500 }
    );
  }
}
