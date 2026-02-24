/**
 * VeloDoc Enterprise Invite — HTML-ready email template.
 * Use getInviteEmailHtml({ joinUrl, organizationName, logoUrl, heroUrl }) in your send flow.
 * Styling: Petroleum Blue background, white & teal accents, email-safe inline CSS.
 */

export type InviteEmailOptions = {
  /** Absolute URL for the "Join Workspace" CTA (e.g. Clerk invite accept link). */
  joinUrl: string;
  /** Organization name to personalize the copy. */
  organizationName?: string;
  /** Absolute URL for the VeloDoc logo (e.g. https://yoursite.com/logo-png.png). */
  logoUrl?: string;
  /** Absolute URL for the hero image (data architecting into structure). */
  heroUrl?: string;
  /** Base URL for the app (used if logoUrl/heroUrl are relative). */
  baseUrl?: string;
};

const PETROLEUM_BLUE = "#0b172a";
const TEAL_ACCENT = "#22d3ee";
const DEFAULT_HERO =
  "https://hupsfpzhdrkmvlskqxbg.supabase.co/storage/v1/object/public/Assets/email-hero.png";

export function getInviteEmailHtml(options: InviteEmailOptions): string {
  const {
    joinUrl,
    organizationName = "Your organization",
    baseUrl = "https://velodoc.app",
    logoUrl = `${baseUrl}/logo-png.png`,
    heroUrl = DEFAULT_HERO,
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>You're invited to VeloDoc Enterprise</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
          <!-- Header: Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${logoUrl}" alt="VeloDoc" width="140" height="56" style="display:block;max-width:140px;height:auto;" />
            </td>
          </tr>
          <!-- Table-based Hero Section (cross-client compatible) -->
          <tr>
            <td style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:${PETROLEUM_BLUE};border-radius:12px;border:1px solid rgba(255,255,255,0.12);">
                <tr>
                  <td align="center" style="background-color:${PETROLEUM_BLUE};padding:32px 24px 24px;">
                    <img src="${heroUrl}" alt="VeloDoc Enterprise Workspace Architecture" width="600" height="240" style="display:block;width:600px;max-width:100%;height:240px;object-fit:cover;border:0;border-radius:8px;" />
                    <p style="margin:24px 0 0;font-size:22px;font-weight:700;line-height:1.3;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;text-shadow:0 0 20px ${TEAL_ACCENT}40;border-bottom:2px solid ${TEAL_ACCENT};display:inline-block;padding-bottom:4px;">
                      The Architecture of Your Data Starts Now.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Headline -->
          <tr>
            <td style="padding:0 24px 16px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;line-height:1.3;color:#ffffff;text-align:center;">
                You've been invited to the VeloDoc Enterprise Workspace
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 24px 24px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#e2e8f0;">
                ${organizationName} has added you to their VeloDoc account. You now have access to the AI Architect to streamline your document workflows.
              </p>
            </td>
          </tr>
          <!-- Industry callout -->
          <tr>
            <td style="padding:0 24px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.25);border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#22d3ee;">
                      Built for enterprise
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#cbd5e1;">
                      VeloDoc handles <strong style="color:#f1f5f9;">Legal</strong>, <strong style="color:#f1f5f9;">Medical</strong>, <strong style="color:#f1f5f9;">Finance</strong>, and <strong style="color:#f1f5f9;">Logistics</strong> documents with institutional precision.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA (brand Teal #22d3ee) -->
          <tr>
            <td align="center" style="padding:8px 24px 40px;">
              <a href="${joinUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:18px 40px;font-size:16px;font-weight:700;color:#0f172a;background-color:#22d3ee;text-decoration:none;border-radius:12px;border:2px solid #22d3ee;">
                Join Workspace
              </a>
            </td>
          </tr>
          <!-- Footer: Security & Compliance badge + legal links -->
          <tr>
            <td style="padding:24px;border-top:1px solid rgba(255,255,255,0.1);">
              <p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">
                VeloDoc — The Universal AI PDF Architect
              </p>
              <p style="margin:0 0 12px;font-size:11px;line-height:1.5;color:#22d3ee;text-align:center;font-weight:600;">
                Security &amp; Compliance
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#64748b;text-align:center;">
                <a href="${baseUrl}/privacy" style="color:#22d3ee;text-decoration:none;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="${baseUrl}/terms" style="color:#22d3ee;text-decoration:none;">Terms</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
