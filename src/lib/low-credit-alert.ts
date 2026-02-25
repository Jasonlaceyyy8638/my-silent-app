/**
 * Low Credit Watchdog: send "Low Fuel" email from billing@velodoc.app when
 * credits_remaining <= threshold. Only sends if low_credit_alert_sent is false;
 * sets it true after sending. Reset when user tops up (Stripe or admin).
 */
import { createClerkClient } from "@clerk/nextjs/server";
import { sendWithSendGrid, SENDGRID_FROM_BILLING } from "@/lib/sendgrid";
import { getSupabase } from "@/lib/supabase";

const LOGO_URL = "https://velodoc.app/logo-png.png";
const LOW_CREDIT_THRESHOLD = 5;

export async function trySendLowCreditAlert(
  userId: string,
  creditsRemaining: number
): Promise<void> {
  if (creditsRemaining > LOW_CREDIT_THRESHOLD) return;
  if (!process.env.SENDGRID_API_KEY?.trim()) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("user_id, email, low_credit_alert_sent")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr || !profile) return;
  const email = (profile as { email?: string | null }).email?.trim();
  const alreadySent = Boolean((profile as { low_credit_alert_sent?: boolean }).low_credit_alert_sent);
  if (!email || alreadySent) return;

  let firstName = "there";
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(userId);
    const name = user.firstName ?? user.username ?? "";
    if (name.trim()) firstName = name.trim();
  } catch {
    // use "there"
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://velodoc.app";
  const buyUrl = `${appUrl}/pricing`;

  const subject = "Action Required: Your VeloDoc Credits are Low";
  const text = `Hello ${firstName},\n\nYou are currently down to ${creditsRemaining} credits.\n\nTo maintain Absolute Precision in your automated reporting, we recommend topping up your balance now. As a monthly subscriber, you can purchase additional "Top-Up" credits at any time without affecting your current allowance.\n\nBuy More Credits: ${buyUrl}\n\n— VeloDoc Billing`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family: Inter, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:32px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); border-top:4px solid #22d3ee;">
          <tr>
            <td style="padding:32px 40px; text-align:center;">
              <img src="${LOGO_URL}" alt="VeloDoc" width="150" style="display:block; margin:0 auto 20px; height:auto; max-width:100%;" />
              <h1 style="margin:0 0 8px; font-size:20px; font-weight:700; color:#0f172a;">Action Required: Your Credits are Low</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0 0 16px; font-size:16px; color:#374151; line-height:1.6;">Hello ${firstName},</p>
              <p style="margin:0 0 16px; font-size:16px; color:#374151; line-height:1.6;">You are currently down to <strong style="color:#22d3ee;">${creditsRemaining} credits</strong>.</p>
              <p style="margin:0 0 24px; font-size:16px; color:#374151; line-height:1.6;">To maintain Absolute Precision in your automated reporting, we recommend topping up your balance now. As a monthly subscriber, you can purchase additional "Top-Up" credits at any time without affecting your current allowance.</p>
              <p style="margin:0 0 24px; text-align:center;">
                <a href="${buyUrl}" style="display:inline-block; background:#22d3ee; color:#0f172a; font-weight:600; font-size:15px; padding:14px 28px; border-radius:10px; text-decoration:none;">Buy More Credits</a>
              </p>
              <p style="margin:0; font-size:14px; color:#6b7280;">— VeloDoc Billing</p>
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
      from: SENDGRID_FROM_BILLING,
      to: email,
      subject,
      text,
      html,
    });
    await supabase
      .from("profiles")
      .update({ low_credit_alert_sent: true })
      .eq("user_id", userId);
  } catch (err) {
    console.error("[low-credit-alert] SendGrid or profile update failed:", err);
  }
}
