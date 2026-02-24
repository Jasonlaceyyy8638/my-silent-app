import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getEmailSignature } from "@/lib/email-signature";

const FROM_EMAIL = process.env.SALES_FROM_EMAIL ?? "sales@velodoc.app";
const SALES_INBOX = "sales@velodoc.app";
const REPLY_TO = process.env.REPLY_TO ?? "billing@velodoc.app";

/**
 * POST /api/emails/new-lead
 * Sends a "New Lead" notification to sales@velodoc.app with Sales signature.
 * Body: { email: string, name?: string, source?: string, message?: string }
 */
export async function POST(request: NextRequest) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  let body: { email?: string; name?: string; source?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const leadEmail = body.email?.trim();
  if (!leadEmail) {
    return NextResponse.json({ error: "Missing 'email'" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "—";
  const source = body.source?.trim() ?? "Website";
  const message = body.message?.trim() ?? "—";
  const salesSignature = getEmailSignature("sales");

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
            <td style="background:#22d3ee; padding:24px 40px; text-align:center;">
              <h1 style="margin:0; font-size:20px; font-weight:700; color:#0f172a;">New Lead</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;"><strong>Email</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">${escapeHtml(leadEmail)}</td></tr>
                <tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;"><strong>Name</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">${escapeHtml(name)}</td></tr>
                <tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;"><strong>Source</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">${escapeHtml(source)}</td></tr>
                <tr><td style="padding:8px 0;"><strong>Message</strong></td><td style="padding:8px 0;">${escapeHtml(message)}</td></tr>
              </table>
              ${salesSignature}
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
      to: SALES_INBOX,
      reply_to: leadEmail,
      subject: `New Lead: ${name !== "—" ? name : leadEmail}`,
      text: `New lead\nEmail: ${leadEmail}\nName: ${name}\nSource: ${source}\nMessage: ${message}`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[new-lead] Resend error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
