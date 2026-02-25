import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  const password = body.password?.trim();
  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const row = await prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    orderBy: { createdAt: "desc" },
  });

  if (!row || row.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const clerk = createClerkClient({ secretKey: clerkSecret });
  const users = await clerk.users.getUserList({ emailAddress: [row.email] });
  const user = users.data.find(
    (u) => u.emailAddresses?.some((e) => e.emailAddress?.toLowerCase() === row.email)
  ) ?? users.data[0];

  if (!user) {
    await prisma.passwordResetToken.deleteMany({ where: { id: row.id } });
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  try {
    await clerk.users.updateUser(user.id, {
      password,
      signOutOfOtherSessions: true,
    });
  } catch (e) {
    console.error("[auth] reset-password: Clerk update failed", e);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }

  await prisma.passwordResetToken.deleteMany({ where: { id: row.id } });

  return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
}
