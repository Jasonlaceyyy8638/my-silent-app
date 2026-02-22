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
    return NextResponse.json({ userId, credits });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { userId, error: "Credits fetch failed", details: msg },
      { status: 500 }
    );
  }
}
