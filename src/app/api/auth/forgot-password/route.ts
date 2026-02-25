import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getTransactionalWrapper } from "@/lib/email-transactional";
import { sendWithSendGrid } from "@/lib/sendgrid";

const RESET_EXPIRY_HOURS = 1;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://velodoc.app";

export async function POST(request: Request) {
  if (!process.env.SENDGRID_API_KEY?.trim()) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

  try {
    await prisma.passwordResetToken.create({
      data: { email, tokenHash, expiresAt },
    });
  } catch (e) {
    console.error("[auth] forgot-password: failed to store token", e);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }

  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const html = getTransactionalWrapper({
    title: "Reset your VeloDoc password",
    bodyHtml: `
      <p>You requested a password reset for your VeloDoc account.</p>
      <p>Click the button below to set a new password. This link expires in ${RESET_EXPIRY_HOURS} hour(s).</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
    ctaLabel: "Reset Password",
    ctaUrl: resetUrl,
  });

  try {
    await sendWithSendGrid({
      to: email,
      subject: "VeloDoc — Reset your password",
      html,
    });
  } catch (err) {
    console.error("[auth] forgot-password: SendGrid failed", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "If an account exists, you will receive a reset link." });
}
