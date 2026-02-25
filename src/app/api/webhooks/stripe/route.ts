import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { addCredits } from "@/lib/credits";
import { addCreditsForAuth } from "@/lib/credits-auth";
import { getEmailSignature } from "@/lib/email-signature";
import { getTransactionalWrapper, getWelcomeTierBody, SUPPORT_FROM } from "@/lib/email-transactional";
import { planDisplayName } from "@/lib/plan-display";
import { getSupabase } from "@/lib/supabase";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
// Validates all incoming Stripe events; set STRIPE_WEBHOOK_SECRET in Netlify to your webhook signing secret.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/** One-time credit grant from checkout (legacy); first-month allowance now set via credits_remaining in profiles. */
const CREDITS_BY_PLAN: Record<string, number> = {
  starter: 1,
  velopack: 20,
  pro: 1,
  enterprise: 100,
};

/** Monthly credit allowance by plan_tier — used for invoice.paid reset and checkout.session.completed first-month grant. */
const CREDITS_ALLOWANCE: Record<string, number> = {
  starter: 25,
  pro: 150,
  enterprise: 500,
};

function getAllowanceForPlan(plan: string): number {
  return CREDITS_ALLOWANCE[plan] ?? 25;
}

const LOGO_URL = "https://velodoc.app/logo-png.png";
// All automated receipts from Starter/Pro/Enterprise: addressed from Alissa Wilson billing@velodoc.app
const BILLING_FROM = process.env.BILLING_FROM_EMAIL ?? "Alissa Wilson <billing@velodoc.app>";
const BILLING_REPLY_TO = process.env.REPLY_TO ?? "billing@velodoc.app";
const ADMIN_EMAIL = process.env.WEEKLY_REPORT_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@velodoc.app";
const BILLING_NOTIFY_EMAIL = process.env.BILLING_NOTIFY_EMAIL ?? process.env.REPLY_TO ?? "billing@velodoc.app";

function priceIdToPlanType(priceId: string | undefined): "starter" | "pro" | "enterprise" | null {
  if (!priceId) return null;
  const starter = process.env.STRIPE_PRICE_ID_STARTER?.trim();
  const pro = process.env.STRIPE_PRICE_ID_PRO?.trim();
  const enterprise = process.env.STRIPE_PRICE_ID_ENTERPRISE?.trim();
  if (starter && priceId === starter) return "starter";
  if (pro && priceId === pro) return "pro";
  if (enterprise && priceId === enterprise) return "enterprise";
  return null;
}

/**
 * Stripe webhook: signature-verified (Stripe SDK), credit-allowance management.
 * Requires Supabase profiles to have: credits_remaining (int), stripe_customer_id (text), stripe_subscription_id (text).
 *
 * - invoice.paid: Resets profiles.credits_remaining by plan_tier (Starter 25, Professional 150, Enterprise 500).
 * - checkout.session.completed: Links stripe_customer_id + stripe_subscription_id to profile and grants first month allowance.
 * - customer.subscription.updated: Updates plan_type and credits_remaining on plan change.
 * All failed Supabase updates are logged with "[Stripe webhook] Absolute Precision audit" for billing audit.
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

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = (subscription.metadata?.userId as string)?.trim();
    const firstItem = subscription.items?.data?.[0];
    const priceId = firstItem?.price?.id;
    const planType = priceIdToPlanType(priceId);

    if (userId && planType) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: existing } = await supabase
            .from("profiles")
            .select("plan_type")
            .eq("user_id", userId)
            .maybeSingle();
          const previousPlan = (existing as { plan_type?: string } | null)?.plan_type ?? null;
          const allowance = getAllowanceForPlan(planType);
          const { error: upsertError } = await supabase.from("profiles").upsert(
            { user_id: userId, plan_type: planType, credits_remaining: allowance },
            { onConflict: "user_id" }
          );
          if (upsertError) {
            console.error("[Stripe webhook] Absolute Precision audit: customer.subscription.updated profiles upsert failed", { error: upsertError.message, code: upsertError.code, userId, planType });
          }
          if (planType === "pro" || planType === "enterprise") {
            try {
              await supabase.from("plan_change_log").insert({
                user_id: userId,
                customer_email: null,
                from_plan: previousPlan ?? null,
                to_plan: planType,
                stripe_session_id: subscription.id,
              });
            } catch (e) {
              console.error("[Stripe webhook] Absolute Precision audit: plan_change_log insert failed", { error: e, userId, planType });
            }
          }
          if (planType === "enterprise" && previousPlan !== "enterprise") {
            const resendKey = process.env.RESEND_API_KEY;
            if (resendKey) {
              try {
                const resend = new Resend(resendKey);
                await resend.emails.send({
                  from: BILLING_FROM,
                  to: BILLING_NOTIFY_EMAIL,
                  replyTo: BILLING_REPLY_TO,
                  subject: "VeloDoc — User upgraded to Enterprise (high-touch support)",
                  text: `A user has upgraded to Enterprise via the Customer Portal.\nSubscription: ${subscription.id}\nUser ID: ${userId}\nPrevious plan: ${previousPlan ?? "—"}\nPlease provide the high-touch support promised for Enterprise.`,
                  html: `<p>A user has upgraded to <strong>Enterprise</strong> via the Customer Portal.</p><p><strong>Subscription:</strong> ${subscription.id}<br/><strong>User ID:</strong> ${userId}<br/><strong>Previous plan:</strong> ${previousPlan ?? "—"}</p><p>Please provide the high-touch support promised for Enterprise.</p>`,
                });
              } catch (err) {
                console.error("[Stripe webhook] Absolute Precision audit: Enterprise upgrade notification failed", { error: err });
              }
            }
          }
        } catch (err) {
          console.error("[Stripe webhook] Absolute Precision audit: customer.subscription.updated profiles update failed", { error: err, userId, planType });
        }
      }
    }
    return NextResponse.json({ received: true });
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;

    if (!subscriptionId || !customerId) {
      console.error("[Stripe webhook] Absolute Precision audit: invoice.paid missing subscription or customer", { invoiceId: invoice.id, subscriptionId, customerId });
      return NextResponse.json({ received: true });
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.error("[Stripe webhook] Absolute Precision audit: invoice.paid Supabase not configured");
      return NextResponse.json({ received: true });
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = (subscription.metadata?.userId as string)?.trim();
      const firstItem = subscription.items?.data?.[0];
      const priceId = firstItem?.price?.id;
      const planType = priceIdToPlanType(priceId);

      let resolvedUserId = userId;
      if (!resolvedUserId) {
        const { data: profileByCustomer } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        resolvedUserId = (profileByCustomer as { user_id?: string } | null)?.user_id?.trim() ?? null;
      }

      if (!resolvedUserId || !planType) {
        console.error("[Stripe webhook] Absolute Precision audit: invoice.paid could not resolve user or plan", { invoiceId: invoice.id, subscriptionId, customerId, resolvedUserId, planType });
        return NextResponse.json({ received: true });
      }

      const allowance = getAllowanceForPlan(planType);
      const { error } = await supabase
        .from("profiles")
        .update({ credits_remaining: allowance })
        .eq("user_id", resolvedUserId);

      if (error) {
        console.error("[Stripe webhook] Absolute Precision audit: invoice.paid credits_remaining update failed", { error: error.message, code: error.code, userId: resolvedUserId, planType, allowance });
        return NextResponse.json({ received: true });
      }
    } catch (err) {
      console.error("[Stripe webhook] Absolute Precision audit: invoice.paid handler failed", { error: err, invoiceId: invoice.id });
    }
    return NextResponse.json({ received: true });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) {
    console.error("[Stripe webhook] Absolute Precision audit: checkout.session.completed missing userId", { sessionId: session.id });
    return NextResponse.json({ error: "Missing user" }, { status: 400 });
  }

  // Webhook mapping: Price IDs from Netlify env -> database plan_type values.
  // STRIPE_PRICE_ID_STARTER -> 'starter'
  // STRIPE_PRICE_ID_PRO -> 'pro'
  // STRIPE_PRICE_ID_ENTERPRISE -> 'enterprise'
  const priceIdStarter = process.env.STRIPE_PRICE_ID_STARTER?.trim();
  const priceIdPro = process.env.STRIPE_PRICE_ID_PRO?.trim();
  const priceIdEnterprise = process.env.STRIPE_PRICE_ID_ENTERPRISE?.trim();
  let planFromPrice: "starter" | "pro" | "enterprise" | null = null;
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const firstPriceId = lineItems.data[0]?.price?.id;
    if (firstPriceId) {
      if (priceIdStarter && firstPriceId === priceIdStarter) planFromPrice = "starter";
      else if (priceIdPro && firstPriceId === priceIdPro) planFromPrice = "pro";
      else if (priceIdEnterprise && firstPriceId === priceIdEnterprise) planFromPrice = "enterprise";
    }
  } catch (e) {
    console.error("[Stripe webhook] Absolute Precision audit: listLineItems failed", { error: e, sessionId: session.id });
  }
  const plan = (planFromPrice ?? (session.metadata?.plan as string) ?? "starter") as string;
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
    console.error("[Stripe webhook] Absolute Precision audit: addCredits failed", { error: err, userId });
    return NextResponse.json(
      { error: "Failed to add credits" },
      { status: 500 }
    );
  }

  // First-time setup: link stripe_customer_id and stripe_subscription_id to profile, grant first month's allowance.
  // Connection audit: profiles filtered by user_id (RLS-compatible).
  const supabase = getSupabase();
  const planForTier = (planFromPrice ?? (session.metadata?.plan as string) ?? plan) as string;
  let previousPlan: string | null = null;
  if (supabase && (planForTier === "starter" || planForTier === "pro" || planForTier === "enterprise")) {
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("plan_type")
        .eq("user_id", userId)
        .maybeSingle();
      previousPlan = (existing as { plan_type?: string } | null)?.plan_type ?? null;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const stripeSubscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription ?? null;
      const firstMonthAllowance = getAllowanceForPlan(planForTier);
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          plan_type: planForTier,
          credits_remaining: firstMonthAllowance,
          ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
          ...(stripeSubscriptionId ? { stripe_subscription_id: stripeSubscriptionId } : {}),
        },
        { onConflict: "user_id" }
      );
      if (upsertError) {
        console.error("[Stripe webhook] Absolute Precision audit: checkout.session.completed profiles upsert failed", { error: upsertError.message, code: upsertError.code, userId, planForTier });
      }
    } catch (e) {
      console.error("[Stripe webhook] Absolute Precision audit: checkout.session.completed profiles update failed", { error: e, userId, planForTier });
    }
    // Team notification: log pro/enterprise updates for Phillip McKenzie's admin view.
    if ((planForTier === "pro" || planForTier === "enterprise") && supabase) {
      const customerEmail =
        (session.customer_details?.email as string | undefined)?.trim() ??
        (session.customer_email as string | undefined) ?? null;
      try {
        await supabase.from("plan_change_log").insert({
          user_id: userId,
          customer_email: customerEmail ?? null,
          from_plan: previousPlan ?? null,
          to_plan: planForTier,
          stripe_session_id: session.id,
        });
      } catch (e) {
        console.error("[Stripe webhook] Absolute Precision audit: plan_change_log insert failed", { error: e, userId, planForTier });
      }
    }
  }

  // Log payment for Phillip McKenzie's Monday morning CSV report (weekly-report reads stripe_payments).
  if (supabase) {
    try {
      await supabase.from("stripe_payments").insert({
        stripe_session_id: session.id,
        user_id: userId,
        plan: planForTier,
        amount_total_cents: session.amount_total ?? 0,
        customer_email: (session.customer_details?.email ?? session.customer_email) ?? null,
      });
    } catch (e) {
      console.error("[Stripe webhook] Absolute Precision audit: stripe_payments insert failed", { error: e, userId, sessionId: session.id });
    }
  }

  // Billing receipt: automated notification from Alissa Wilson at billing@velodoc.app
  const customerEmail =
    (session.customer_details?.email as string | undefined)?.trim() ??
    (session.customer_email as string | undefined)?.trim();
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && customerEmail) {
    const planLabel = planDisplayName(planForTier);
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
        replyTo: BILLING_REPLY_TO,
        subject: "VeloDoc — Payment received",
        text: `Payment received. Plan: ${planLabel}. Amount: $${amountPaid}. Credits added: ${amount}. Thank you.`,
        html,
      });
    } catch (err) {
      console.error("[Stripe webhook] Absolute Precision audit: billing receipt email failed", { error: err });
    }

    // Institutional welcome email (tier-based): from support@velodoc.app, Go to Dashboard CTA
    if (planForTier === "starter" || planForTier === "pro" || planForTier === "enterprise") {
      const firstName = (session.customer_details?.name ?? session.customer_details?.email ?? "")
        .toString()
        .trim()
        .split(/\s+/)[0] ?? "";
      const welcomeBody = getWelcomeTierBody(planForTier as "starter" | "pro" | "enterprise", firstName);
      const welcomeHtml = getTransactionalWrapper({
        title: `Welcome to VeloDoc ${planDisplayName(planForTier)}`,
        bodyHtml: welcomeBody,
        ctaLabel: "Go to Dashboard",
      });
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: SUPPORT_FROM,
          to: customerEmail,
          replyTo: BILLING_REPLY_TO,
          subject: `Welcome to VeloDoc ${planDisplayName(planForTier)}`,
          html: welcomeHtml,
        });
      } catch (err) {
        console.error("[Stripe webhook] Absolute Precision audit: tier welcome email failed", { error: err, planForTier });
      }
    }
  }

  // Notify admin and Alissa when an Enterprise subscription is initiated (checkout or high-touch).
  if (planForTier === "enterprise" && resendKey) {
    const customerEmail =
      (session.customer_details?.email as string | undefined)?.trim() ??
      (session.customer_email as string | undefined)?.trim() ??
      "—";
    const amountPaid = session.amount_total != null ? (session.amount_total / 100).toFixed(2) : "—";
    const payload = {
      from: BILLING_FROM as string,
      replyTo: BILLING_REPLY_TO,
      subject: "VeloDoc — Enterprise subscription initiated",
      text: `Enterprise subscription completed.\nSession: ${session.id}\nCustomer: ${customerEmail}\nAmount: $${amountPaid}\nUser ID: ${userId}`,
      html: `<p>Enterprise subscription completed.</p><p><strong>Session:</strong> ${session.id}<br/><strong>Customer:</strong> ${customerEmail}<br/><strong>Amount:</strong> $${amountPaid}<br/><strong>User ID:</strong> ${userId}</p>`,
    };
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({ ...payload, to: ADMIN_EMAIL });
    } catch (err) {
      console.error("[Stripe webhook] Absolute Precision audit: Enterprise notification to admin failed", { error: err });
    }
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        ...payload,
        to: BILLING_NOTIFY_EMAIL,
        subject: "VeloDoc — Enterprise subscription initiated (high-touch support)",
      });
    } catch (err) {
      console.error("[Stripe webhook] Absolute Precision audit: Enterprise notification to Alissa failed", { error: err });
    }
  }

  return NextResponse.json({ received: true });
}
