import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getEmailSignature } from "@/lib/email-signature";

const FROM_EMAIL = process.env.SUPPORT_FROM_EMAIL ?? "support@velodoc.app";
const REPLY_TO = process.env.REPLY_TO ?? "billing@velodoc.app";

/**
 * POST /api/emails/ticket-received
 * Sends a "Ticket Received" confirmation to the customer from support@velodoc.app with Support signature.
 * Body: { to: string, ticketId?: string, subject?: string }
 */
export async function POST(request: NextRequest) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  let body: { to?: string; ticketId?: string; subject?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const to = body.to?.trim();
  if (!to) {
    return NextResponse.json({ error: "Missing 'to' email" }, { status: 400 });
  }

  const ticketId = body.ticketId ?? `TKT-${Date.now()}`;
  const supportSignature = getEmailSignature("support");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family: Inter, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:32px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 16px; font-size:20px; font-weight:700; color:#0f172a;">Ticket Received</h1>
              <p style="margin:0 0 8px; font-size:15px; color:#374151; line-height:1.6;">We've received your request. Reference: <strong>${ticketId}</strong>.</p>
              <p style="margin:0 0 24px; font-size:15px; color:#374151; line-height:1.6;">Our team will respond as soon as possible. For urgent billing questions, reply to this email or contact billing@velodoc.app.</p>
              ${supportSignature}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resend = new Resend(key);
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      reply_to: REPLY_TO,
      subject: body.subject ?? `Ticket Received – ${ticketId}`,
      text: `We've received your request. Reference: ${ticketId}. Our team will respond as soon as possible.`,
      html,
    });
    return NextResponse.json({ ok: true, ticketId });
  } catch (err) {
    console.error("[ticket-received] Resend error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
