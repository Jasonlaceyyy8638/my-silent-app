/**
 * SendGrid mail helper. Every email must originate from a verified velodoc.app departmental address.
 * Do not use resend.dev, test addresses, or any sender other than the four below.
 */
import sgMail from "@sendgrid/mail";

/** Verified departmental senders (velodoc.app authenticated in SendGrid). Only these four may be used. */
export const SENDGRID_FROM_BILLING = "billing@velodoc.app";
export const SENDGRID_FROM_SALES = "sales@velodoc.app";
export const SENDGRID_FROM_SUPPORT = "support@velodoc.app";
export const SENDGRID_FROM_ADMIN = "admin@velodoc.app";

const VERIFIED_FROM_ADDRESSES = new Set([
  SENDGRID_FROM_BILLING,
  SENDGRID_FROM_SALES,
  SENDGRID_FROM_SUPPORT,
  SENDGRID_FROM_ADMIN,
]);

export type SendGridOptions = {
  to: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: Array<{
    content: string; // base64
    filename: string;
    type?: string;
  }>;
};

function getApiKey(): string | null {
  return process.env.SENDGRID_API_KEY?.trim() ?? null;
}

export function isSendGridConfigured(): boolean {
  return !!getApiKey();
}

function isSendGridAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: number }).code;
  const status = (err as { response?: { statusCode?: number } }).response?.statusCode;
  const body = (err as { response?: { body?: { errors?: unknown[] } } }).response?.body;
  const message = String((err as { message?: string }).message ?? "").toLowerCase();
  if (code === 401 || code === 403 || status === 401 || status === 403) return true;
  if (message.includes("unauthorized") || message.includes("forbidden") || message.includes("permission")) return true;
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  return errors.some(
    (e: unknown) =>
      String((e as { message?: string }).message ?? "").toLowerCase().includes("unauthorized") ||
      String((e as { message?: string }).message ?? "").toLowerCase().includes("permission")
  );
}

export async function sendWithSendGrid(options: SendGridOptions): Promise<void> {
  const key = getApiKey();
  if (!key) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  sgMail.setApiKey(key);
  const from = options.from ?? SENDGRID_FROM_SUPPORT;
  const fromAddress = typeof from === "string" ? from : (from as { email?: string }).email ?? "";
  if (!VERIFIED_FROM_ADDRESSES.has(fromAddress)) {
    console.error("[SendGrid] Rejected non-verified from address. Use only support@, billing@, sales@, or admin@velodoc.app.", { from: fromAddress });
    throw new Error("Email from address must be a verified velodoc.app departmental address (support@, billing@, sales@, or admin@velodoc.app)");
  }
  const msg = {
    to: options.to,
    from,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map((a) => ({
      content: a.content,
      filename: a.filename,
      type: a.type ?? "application/octet-stream",
      disposition: "attachment" as const,
    })),
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    if (isSendGridAuthError(err)) {
      const response = (err as { response?: { body?: unknown; statusCode?: number } }).response;
      console.error("[SendGrid] Unauthorized or insufficient permissions. Ensure SENDGRID_API_KEY has Full Access in SendGrid (Settings → API Keys).", {
        statusCode: response?.statusCode,
        body: response?.body,
      });
    } else {
      console.error("[SendGrid] Send failed:", err);
    }
    throw err;
  }
}
