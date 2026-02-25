import { NextRequest, NextResponse } from "next/server";
import { sendWithSendGrid, SENDGRID_FROM_SALES } from "@/lib/sendgrid";
import { getSupabase } from "@/lib/supabase";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://velodoc.app";
const LOGO_URL = "https://velodoc.app/logo-png.png";
const SIGNATURE = "Jason Lacey | VeloDoc Architectural Lead";

/**
 * POST /api/webhooks/review-request
 * Called by Supabase Database Webhook when a row is inserted into review_request_queue
 * (triggered when a user reaches exactly 10 successful syncs in sync_history).
 * Sends a professional review-request email from sales@velodoc.app with feedback form link.
 *
 * Supabase webhook payload: { type: "INSERT", table: "review_request_queue", record: { id, user_id, email, ... } }
 * Optional: set REVIEW_WEBHOOK_SECRET and send x-review-secret header to authorize.
 */
export async function POST(request: NextRequest) {
  if (!process.env.SENDGRID_API_KEY?.trim()) {
    console.error("[review-request] SENDGRID_API_KEY not set");
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const secret = request.headers.get("x-review-secret")?.trim();
  const envSecret = process.env.REVIEW_WEBHOOK_SECRET?.trim();
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; table?: string; record?: { id?: string; user_id?: string; email?: string; sent_at?: string | null } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  type PayloadRecord = { id?: string; user_id?: string; email?: string };
  const record = (body.record ?? body) as PayloadRecord;
  const email = record.email?.trim();
  const userId = record.user_id?.trim();
  const queueId = record.id;
  if (!email) {
    return NextResponse.json({ error: "Missing email in payload" }, { status: 400 });
  }

  const feedbackFormUrl = userId ? `${APP_URL}/review/${encodeURIComponent(userId)}` : (process.env.FEEDBACK_FORM_URL?.trim() || `${APP_URL}/feedback`);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>img { max-width: 100%; height: auto; }</style>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family: Inter, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); border-top:4px solid #22d3ee;">
          <tr>
            <td style="padding:28px 24px; text-align:center;">
              <img src="${LOGO_URL}" alt="VeloDoc" width="140" style="display:block; margin:0 auto 16px; height:auto;" />
              <h1 style="margin:0; font-size:20px; font-weight:700; color:#0f172a;">You’ve hit 10 successful syncs</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0 0 16px; font-size:16px; color:#374151; line-height:1.7;">Thank you for using VeloDoc to sync your documents to QuickBooks. Your workflow is running with <strong>Absolute Precision</strong>.</p>
              <p style="margin:0 0 24px; font-size:16px; color:#374151; line-height:1.7;">We’d love to hear how it’s going. Your feedback helps us improve the experience for everyone.</p>
              <p style="margin:0 0 24px; text-align:center;">
                <a href="${feedbackFormUrl}" style="display:inline-block; background:#22d3ee; color:#0f172a; font-weight:600; font-size:15px; padding:14px 28px; border-radius:10px; text-decoration:none;">Share your feedback</a>
              </p>
              <p style="margin:0; font-size:14px; color:#64748b;">${SIGNATURE}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await sendWithSendGrid({
      from: SENDGRID_FROM_SALES,
      to: email,
      subject: "Quick question: how’s VeloDoc working for you?",
      text: `You've hit 10 successful syncs with VeloDoc. Thank you for using Absolute Precision. We'd love your feedback: ${feedbackFormUrl}\n\n${SIGNATURE}`,
      html,
    });
  } catch (err) {
    console.error("[review-request] SendGrid failed:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  if (queueId) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from("review_request_queue")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", queueId);
    }
  }

  return NextResponse.json({ ok: true, email });
}
