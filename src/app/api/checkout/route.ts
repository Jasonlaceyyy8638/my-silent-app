import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

// Pricing cards map to Stripe Price IDs from Netlify env: STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_ENTERPRISE.
// Description shown in Stripe Checkout when using price_data (no Price ID). When using Price IDs, set product description in Stripe Dashboard to match.
const PLANS = {
  starter: {
    name: "Starter — Monthly",
    description: "VeloDoc Starter - Platform Access & Support. Credits not included.",
    unit_amount: 2900, // $29
    quantity: 1,
  },
  pro: {
    name: "Professional — Monthly",
    description: "VeloDoc Professional - Platform Access & Support. Credits not included.",
    unit_amount: 7900, // $79
    quantity: 1,
  },
  enterprise: {
    name: "Enterprise — Monthly",
    description: "VeloDoc Enterprise - Platform Access & Support. Credits not included.",
    unit_amount: 24900, // $249
    quantity: 1,
  },
} as const;

export async function POST(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to buy credits." },
      { status: 401 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/$/, "") ||
      "http://localhost:3000";
    const baseUrlClean = baseUrl.replace(/\/$/, "");

    let plan: "starter" | "pro" | "enterprise" = "starter";
    try {
      const body = await request.json();
      if (body?.plan === "pro" || body?.plan === "enterprise") plan = body.plan;
    } catch {
      // default to starter
    }

    // Use Netlify env Price IDs when set (firewalled tiers from VeloDoc Stripe account).
    const priceIdStarter = process.env.STRIPE_PRICE_ID_STARTER?.trim();
    const priceIdPro = process.env.STRIPE_PRICE_ID_PRO?.trim();
    const priceIdEnterprise = process.env.STRIPE_PRICE_ID_ENTERPRISE?.trim();
    const priceId =
      plan === "starter" ? priceIdStarter : plan === "pro" ? priceIdPro : priceIdEnterprise;

    const config = PLANS[plan];
    // Subscription mode: use recurring Price IDs or price_data with recurring. All three tiers use the same subscription mode.
    const lineItems: Stripe.Checkout.SessionCreateParams["line_items"] = [
      priceId
        ? { price: priceId, quantity: config.quantity }
        : {
            price_data: {
              currency: "usd" as const,
              product_data: {
                name: config.name,
                description: config.description,
              },
              unit_amount: config.unit_amount,
              recurring: { interval: "month" as const },
            },
            quantity: config.quantity,
          },
    ];
    const successUrl = `${baseUrlClean}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`;
    const metadata: Record<string, string> = {
      plan,
      userId,
      billing_contact_email: process.env.BILLING_CONTACT_EMAIL ?? "billing@velodoc.app",
      billing_contact_name: process.env.BILLING_CONTACT_NAME ?? "Alissa Wilson",
    };
    if (orgId && orgId.trim()) metadata.organizationId = orgId;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      client_reference_id: userId,
      metadata,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: baseUrlClean,
      subscription_data: {
        metadata: orgId && orgId.trim() ? { plan, userId, organizationId: orgId } : { plan, userId },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    const message =
      err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
