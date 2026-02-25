/**
 * SendGrid mail helper. All transactional emails from support use:
 * from "Jason Lacey <support@velodoc.app>"
 */

import sgMail from "@sendgrid/mail";

export const SENDGRID_FROM_SUPPORT = "Jason Lacey <support@velodoc.app>";

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

export async function sendWithSendGrid(options: SendGridOptions): Promise<void> {
  const key = getApiKey();
  if (!key) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  sgMail.setApiKey(key);
  const from = options.from ?? SENDGRID_FROM_SUPPORT;
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
  await sgMail.send(msg);
}
