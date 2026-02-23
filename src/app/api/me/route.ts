import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureWelcomeCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

const norm = (s: string) => s.trim().toLowerCase();

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const credits = await ensureWelcomeCredits(userId);
    const url = process.env.DATABASE_URL ?? "";
    const projectRef = url.match(/prisma\.([a-zA-Z0-9]+)/)?.[1] ?? null;

    const debug = new URL(request.url).searchParams.get("debug") === "1";
    let payload: Record<string, unknown> = {
      userId,
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
