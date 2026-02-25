/**
 * Shared VeloDoc transactional email layout: teal/white branding, mobile-responsive.
 * Support transactional wrapper. From is always support@velodoc.app (verified sender).
 */

const LOGO_URL = "https://velodoc.app/logo-png.png";
const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/dashboard`
  : "https://velodoc.app/dashboard";

/** Must match verified sender in Supabase/SendGrid */
export const SUPPORT_FROM = "support@velodoc.app";

export function getTransactionalWrapper(options: {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const { title, bodyHtml, ctaLabel = "Go to Dashboard", ctaUrl = DASHBOARD_URL } = options;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style type="text/css">
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; }
    .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    @media screen and (max-width: 600px) {
      .wrapper { width: 100% !important; max-width: 100% !important; }
      .inner { padding-left: 20px !important; padding-right: 20px !important; }
      .cta-block { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family: Inter, Helvetica, Arial, sans-serif; width:100%; -webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f7; min-height:100vh;">
    <tr>
      <td align="center" style="padding:24px 16px; box-sizing:border-box;">
        <table role="presentation" class="wrapper" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); border-top:4px solid #22d3ee;">
          <tr>
            <td class="inner" style="padding:28px 40px 20px; text-align:center; box-sizing:border-box;">
              <img src="${LOGO_URL}" alt="VeloDoc" width="150" style="display:block; margin:0 auto 16px; height:auto; max-width:150px;" />
              <h1 style="margin:0; font-size:20px; font-weight:700; color:#0f172a; line-height:1.3;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td class="inner mobile-padding" style="padding:0 40px 28px; box-sizing:border-box;">
              <div style="font-size:15px; color:#374151; line-height:1.7;">
                ${bodyHtml}
              </div>
              <p style="margin:24px 0 0; text-align:center;">
                <a href="${ctaUrl}" class="cta-block" style="display:inline-block; background:#22d3ee; color:#0f172a; font-weight:600; font-size:14px; padding:12px 24px; border-radius:10px; text-decoration:none;">${ctaLabel}</a>
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px; padding-top:20px; border-top:1px solid #e5e7eb;">
                <tr>
                  <td>
                    <img src="${LOGO_URL}" alt="VeloDoc" width="120" style="display:block; margin-bottom:8px; height:auto; max-width:120px;" />
                    <p style="margin:0; font-size:14px; color:#6b7280;">VeloDoc Support — support@velodoc.app</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/** Tier-based welcome body (HTML) for Stripe checkout.session.completed */
export function getWelcomeTierBody(plan: "starter" | "pro" | "enterprise", firstName: string): string {
  const name = firstName?.trim() || "there";
  const starter = `
    <p>Welcome to <strong>VeloDoc Starter</strong>. You now have <strong style="color:#22d3ee;">25 Architectural Credits</strong> to turn PDFs into structured data.</p>
    <p>Upload invoices, BOLs, or contracts and export to Excel or QuickBooks. Your dashboard is ready.</p>`;
  const pro = `
    <p>Welcome to <strong>VeloDoc Professional</strong>. You have <strong style="color:#22d3ee;">150 Architectural Credits</strong> and the full QuickBooks bridge.</p>
    <p>Your first <strong>Monday 8 AM Report</strong> is already scheduled—a comprehensive CSV of your nationwide sync history will land in your inbox every week.</p>
    <p>Head to your dashboard to connect QuickBooks and start architecting.</p>`;
  const enterprise = `
    <p>Welcome to <strong>VeloDoc Enterprise</strong>. You have <strong style="color:#22d3ee;">500 Architectural Credits</strong>, <strong>Priority Support</strong>, and <strong>Nationwide Compliance</strong> status.</p>
    <p>Your dedicated support line and Monday 8 AM reports are active. Use your dashboard to connect systems and scale.</p>`;
  const body = plan === "starter" ? starter : plan === "pro" ? pro : enterprise;
  return `<p>Hello ${name},</p>${body}`;
}
