const LOGO_URL = "https://velodoc.app/logo-png.png";
const LOGO_WIDTH = 150;

export type EmailSignatureType = "sales" | "support" | "admin" | "billing";

const SIGNATURE_CONFIG: Record<
  EmailSignatureType,
  { name: string; email: string; line: string }
> = {
  admin: {
    name: "Phillip McKenzie",
    email: "admin@velodoc.app",
    line: "Reports & system notifications",
  },
  billing: {
    name: "Alissa Wilson",
    email: "billing@velodoc.app",
    line: "Billing & account inquiries",
  },
  support: {
    name: "Sharon Ferguson",
    email: "support@velodoc.app",
    line: "We're here to help",
  },
  sales: {
    name: "Jason Lacey",
    email: "sales@velodoc.app",
    line: "Nationwide enterprise solutions",
  },
};

/**
 * Returns an HTML signature block for transactional emails.
 * Use with type "sales" | "support" | "admin" | "billing" for the sender context.
 * Includes the VeloDoc logo (150px width) and assigned team member name and email.
 */
export function getEmailSignature(type: EmailSignatureType): string {
  const { name, email, line } = SIGNATURE_CONFIG[type];
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px; padding-top:24px; border-top:1px solid #e5e7eb;">
  <tr>
    <td>
      <img src="${LOGO_URL}" alt="VeloDoc" width="${LOGO_WIDTH}" style="display:block; margin-bottom:12px; height:auto;" />
      <p style="margin:0; font-size:15px; font-weight:600; color:#0f172a;">${name}</p>
      <p style="margin:2px 0 0; font-size:14px; color:#22d3ee;"><a href="mailto:${email}" style="color:#22d3ee; text-decoration:none;">${email}</a></p>
      <p style="margin:4px 0 0; font-size:14px; color:#6b7280;">${line}</p>
    </td>
  </tr>
</table>`.trim();
}
