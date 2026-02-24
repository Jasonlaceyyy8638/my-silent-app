import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { Resend } from "resend";
import { ensureWelcomeCredits } from "@/lib/credits";
import { getEmailSignature } from "@/lib/email-signature";

const FROM_EMAIL = process.env.FROM_EMAIL ?? process.env.WEEKLY_REPORT_FROM_EMAIL ?? "noreply@velodoc.app";
const REPLY_TO_EMAIL = process.env.REPLY_TO ?? "billing@velodoc.app";
const WELCOME_SUBJECT = "Welcome to VeloDoc";
const DASHBOARD_URL = "https://velodoc.app/dashboard";

function getWelcomeBody(firstName: string): string {
  const first_name = firstName || "there";
  return `Hello ${first_name},

Welcome to VeloDoc—the Universal Data Engine. We built this to solve a universal problem: the hours we lose to manual data entry. Whether you're processing business invoices, academic research, or personal records, VeloDoc's AI doesn't just scan your files; it understands them.

The Architecture of Your Data Starts Now.

Getting started: 1) Upload any PDF 2) Architect the data (our AI reads the context) 3) Export to Excel or Google Sheets.

Launch your dashboard: ${DASHBOARD_URL}

Welcome to the future of the PDF.`.trim();
}

function getWelcomeHtml(firstName: string): string {
  const first_name = firstName || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to VeloDoc</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family: Inter, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:56px 24px 72px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(180deg, #1e293b 0%, #0f172a 100%); padding:56px 48px 48px; text-align:center;">
              <h1 style="margin:0; font-size:28px; font-weight:700; color:#ffffff; letter-spacing:-0.02em; line-height:1.3;">
                The Architecture of Your Data Starts Now.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 48px 40px;">
              <p style="margin:0 0 20px; font-size:17px; color:#374151; line-height:1.7;">
                Hello ${first_name},
              </p>
              <p style="margin:0 0 32px; font-size:17px; color:#374151; line-height:1.7;">
                Welcome to VeloDoc—the Universal Data Engine. We built this to solve a universal problem: the hours we lose to manual data entry. Whether you're processing business invoices, academic research, or personal records, VeloDoc's AI doesn't just scan your files; it understands them.
              </p>
              <h2 style="margin:0 0 24px; font-size:15px; font-weight:700; color:#0f172a; letter-spacing:0.02em; text-transform:uppercase;">
                Getting Started
              </h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 0; border-bottom:1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" style="vertical-align:top; padding-right:16px;">
                          <span style="display:inline-block; width:28px; height:28px; background:#0f172a; color:#fff; font-size:14px; font-weight:700; line-height:28px; text-align:center; border-radius:8px;">1</span>
                        </td>
                        <td>
                          <p style="margin:0; font-size:17px; font-weight:600; color:#111827;">Upload any PDF</p>
                          <p style="margin:4px 0 0; font-size:15px; color:#6b7280; line-height:1.6;">Drop your file—no setup required.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0; border-bottom:1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" style="vertical-align:top; padding-right:16px;">
                          <span style="display:inline-block; width:28px; height:28px; background:#0f172a; color:#fff; font-size:14px; font-weight:700; line-height:28px; text-align:center; border-radius:8px;">2</span>
                        </td>
                        <td>
                          <p style="margin:0; font-size:17px; font-weight:600; color:#111827;">Architect the data</p>
                          <p style="margin:4px 0 0; font-size:15px; color:#6b7280; line-height:1.6;">Our AI reads the context and structures everything.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" style="vertical-align:top; padding-right:16px;">
                          <span style="display:inline-block; width:28px; height:28px; background:#0f172a; color:#fff; font-size:14px; font-weight:700; line-height:28px; text-align:center; border-radius:8px;">3</span>
                        </td>
                        <td>
                          <p style="margin:0; font-size:17px; font-weight:600; color:#111827;">Export to Excel or Google Sheets</p>
                          <p style="margin:4px 0 0; font-size:15px; color:#6b7280; line-height:1.6;">Download your data and keep moving.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:40px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${DASHBOARD_URL}" style="display:inline-block; padding:18px 40px; background-color:#0f172a; color:#ffffff; font-size:17px; font-weight:700; text-decoration:none; border-radius:12px; line-height:1;">
                      Launch Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0; font-size:17px; color:#374151; line-height:1.7;">
                Welcome to the future of the PDF.
              </p>
              ${getEmailSignature("support")}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type ClerkUserCreatedData = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: Array<{ email_address: string; id: string }>;
  primary_email_address_id?: string | null;
};

export async function POST(request: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SIGNING_SECRET not set" },
      { status: 500 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set" },
      { status: 500 }
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  const wh = new Webhook(signingSecret);
  let payload: { type: string; data?: ClerkUserCreatedData };

  try {
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data?: ClerkUserCreatedData };
  } catch (err) {
    console.error("Clerk webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  if (payload.type !== "user.created" || !payload.data) {
    return NextResponse.json({ received: true });
  }

  const data = payload.data as ClerkUserCreatedData;
  const userId = data.id;
  const emailAddresses = data.email_addresses ?? [];
  const primaryId = data.primary_email_address_id;
  const primary = primaryId
    ? emailAddresses.find((e) => e.id === primaryId)
    : emailAddresses[0];
  const toEmail = primary?.email_address;

  if (!toEmail) {
    console.warn("Clerk webhook user.created: no email for user", data.id);
    return NextResponse.json({ received: true });
  }

  // Production audit: ensure production uses Production instance keys (pk_live_ / sk_live_), not Development (pk_test_ / sk_test_).
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (process.env.NODE_ENV === "production" && pubKey.startsWith("pk_test_")) {
    console.warn(
      "[Clerk] Production build is using Development keys (pk_test_). Use Production instance keys (pk_live_ / sk_live_) in production."
    );
  }

  // After-signup hook: push 5 free credits into user_credits (Prisma → Supabase Postgres) immediately so the user sees them on first dashboard load.
  const CREDITS_TIMEOUT_MS = 8_000;
  if (userId) {
    try {
      await Promise.race([
        ensureWelcomeCredits(userId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("user_credits upsert timeout")), CREDITS_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      console.error("Clerk webhook: user_credits upsert failed or timed out:", err);
      // Still return 200 so Clerk doesn't retry; ensureWelcomeCredits runs again on first /api/credits or /api/extract.
    }
  }

  const firstName = data.first_name?.trim() || "";
  const textBody = getWelcomeBody(firstName);
  const htmlBody = getWelcomeHtml(firstName);

  const resend = new Resend(resendApiKey);
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      replyTo: REPLY_TO_EMAIL,
      subject: WELCOME_SUBJECT,
      text: textBody,
      html: htmlBody,
    });
  } catch (err) {
    console.error("Resend welcome email failed:", err);
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
