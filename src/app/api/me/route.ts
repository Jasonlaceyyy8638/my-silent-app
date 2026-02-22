import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Returns the current user's Clerk ID. Use this once to get the exact
 * userId for the SQL grant (Supabase → SQL Editor). Delete this file
 * after you're done if you don't want it in production.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({ userId });
}
