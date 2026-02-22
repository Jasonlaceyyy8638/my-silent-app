import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

/**
 * Returns the current user's Clerk ID and their credits from the DB.
 * rawCredits = direct SQL to confirm what's actually in the DB for this connection.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const credits = await getCredits(userId);
    // What does this connection see? (proves if we're on the right DB)
    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*)::bigint as count FROM "UserCredits"
    `;
    const totalRows = Number(countResult[0]?.count ?? 0);
    const raw = await prisma.$queryRaw<{ credits: number }[]>`
      SELECT credits FROM "UserCredits" WHERE "userId" = ${userId}
    `;
    const rawCredits = raw[0]?.credits ?? null;
    // List userIds in table so we can see if yours is there (debug only)
    const allRows = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT "userId" FROM "UserCredits"
    `;
    const userIdsInTable = allRows.map((r) => r.userId);
    const url = process.env.DATABASE_URL ?? "";
    const match = url.match(/prisma\.([a-zA-Z0-9]+)/);
    const projectRef = match ? match[1] : null;
    return NextResponse.json({
      userId,
      credits,
      rawCredits,
      totalRowsInTable: totalRows,
      userIdsInTable,
      dbHint: projectRef
        ? `App DB project ref: ${projectRef} — run SQL in Supabase project with this ref in the URL`
        : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { userId, error: "Credits fetch failed", details: msg },
      { status: 500 }
    );
  }
}
