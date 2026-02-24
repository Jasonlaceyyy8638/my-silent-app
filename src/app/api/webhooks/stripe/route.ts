import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { addCredits } from "@/lib/credits";
import { addCreditsForAuth } from "@/lib/credits-auth";
import { getEmailSignature } from "@/lib/email-signature";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const CREDITS_BY_PLAN: Record<string, number> = {
  starter: 1,
  velopack: 20,
  pro: 1,
};

const LOGO_URL = "https://velodoc.app/logo-png.png";
// Subscription/billing receipts: signed by Alissa Wilson at billing@velodoc.app
const BILLING_FROM = process.env.BILLING_FROM_EMAIL ?? "Alissa Wilson <billing@velodoc.app>";
const BILLING_REPLY_TO = process.env.REPLY_TO ?? "billing@velodoc.app";

/**
 * Stripe webhook: signature-verified, ready for team-managed Stripe roles.
 * Handles checkout.session.completed (credits + billing receipt). Other event types acknowledged with 200.
 */
export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) {
    console.error("Stripe webhook: no userId in session", session.id);
    return NextResponse.json({ error: "Missing user" }, { status: 400 });
  }

  const plan = (session.metadata?.plan as string) ?? "starter";
  const metadataCredits = session.metadata?.credits;
  const fromMetadata =
    metadataCredits != null && String(metadataCredits).trim() !== ""
      ? Math.max(1, Math.round(Number(metadataCredits)))
      : null;
  const amount: number =
    Number.isFinite(fromMetadata) && fromMetadata != null
      ? fromMetadata
      : CREDITS_BY_PLAN[plan] ?? 1;

  const organizationId =
    (session.metadata?.organizationId as string) ??
    (session.metadata?.orgId as string) ??
    (session.metadata?.corporate === "true" && session.metadata?.organizationId
      ? (session.metadata.organizationId as string)
      : null);

  try {
    if (organizationId && organizationId.trim()) {
      await addCreditsForAuth(userId, amount, organizationId);
    } else {
      await addCredits(userId, amount);
    }
  } catch (err) {
    console.error("Webhook addCredits error:", err);
    return NextResponse.json(
      { error: "Failed to add credits" },
      { status: 500 }
    );
  }

  // Billing receipt: logo + Alissa Wilson signature
  const customerEmail =
    (session.customer_details?.email as string | undefined)?.trim() ??
    (session.customer_email as string | undefined)?.trim();
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && customerEmail) {
    const planLabel = (session.metadata?.plan as string) ?? plan;
    const amountPaid = session.amount_total != null ? (session.amount_total / 100).toFixed(2) : "—";
    const billingSignature = getEmailSignature("billing");
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
            <td style="padding:32px 40px; text-align:center;">
              <img src="${LOGO_URL}" alt="VeloDoc" width="150" style="display:block; margin:0 auto 20px; height:auto;" />
              <h1 style="margin:0 0 8px; font-size:20px; font-weight:700; color:#0f172a;">Payment received</h1>
              <p style="margin:0; font-size:15px; color:#374151;">Thank you for your purchase.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;"><strong>Plan</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">${planLabel}</td></tr>
                <tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;"><strong>Amount</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">$${amountPaid}</td></tr>
                <tr><td style="padding:8px 0;"><strong>Credits added</strong></td><td style="padding:8px 0;">${amount}</td></tr>
              </table>
              ${billingSignature}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: BILLING_FROM,
        to: customerEmail,
        reply_to: BILLING_REPLY_TO,
        subject: "VeloDoc — Payment received",
        text: `Payment received. Plan: ${planLabel}. Amount: $${amountPaid}. Credits added: ${amount}. Thank you.`,
        html,
      });
    } catch (err) {
      console.error("Stripe webhook: billing receipt email failed", err);
    }
  }

  return NextResponse.json({ received: true });
}
