import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureWelcomeCredits } from "@/lib/credits";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const credits = await ensureWelcomeCredits(userId);
    return NextResponse.json({ credits });
  } catch (err) {
    console.error("Credits error:", err);
    return NextResponse.json(
      { error: "Failed to load credits" },
      { status: 500 }
    );
  }
}
