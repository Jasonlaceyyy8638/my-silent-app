import { NextResponse } from "next/server";
import { Webhook } from "svix";
import sgMail from "@sendgrid/mail";

const FROM_EMAIL = "jason@velodoc.app";
const WELCOME_SUBJECT = "Welcome to VeloDoc – Let's get those PDFs sorted 🛠️";

function getWelcomeBody(firstName: string): string {
  const first_name = firstName || "there";
  return `Hey ${first_name},

I'm Jason, the founder of VeloDoc. Like you, I've spent plenty of time in the field and running a service business. I built VeloDoc because I got tired of manually typing data from messy invoices and logistics PDFs into spreadsheets.

Your account is active and your PDF Architect is ready. Just log in and upload your first file—we'll handle the heavy lifting from there.

If you have any questions, just hit reply.`.trim();
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

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SENDGRID_API_KEY not set" },
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

  const firstName = data.first_name?.trim() || "";

  sgMail.setApiKey(apiKey);

  const textBody = getWelcomeBody(firstName);
  const htmlBody = textBody
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("");

  try {
    await sgMail.send({
      to: toEmail,
      from: FROM_EMAIL,
      replyTo: "service@bgrdayton.com",
      subject: WELCOME_SUBJECT,
      text: textBody,
      html: htmlBody,
    });
  } catch (err) {
    console.error("SendGrid welcome email failed:", err);
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
