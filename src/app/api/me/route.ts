import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCredits } from "@/lib/credits";

/**
 * Returns the current user's Clerk ID and their credits from the DB.
 * Use to verify the correct userId and that the DB row exists.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const credits = await getCredits(userId);
    // So you can confirm app uses the same Supabase project as where you run SQL
    const url = process.env.DATABASE_URL ?? "";
    const match = url.match(/prisma\.([a-zA-Z0-9]+)/);
    const projectRef = match ? match[1] : null;
    return NextResponse.json({
      userId,
      credits,
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
