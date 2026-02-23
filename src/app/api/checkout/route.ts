import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const MIN_BULK_CREDITS = 1;
const MAX_BULK_CREDITS = 1000;

/** Cents per credit by tier: 1–99 $1.00; 100–499 $0.90; 500–999 $0.85; 1,000+ $0.80 */
function getCentsPerCredit(credits: number): number {
  if (credits >= 1000) return 80;
  if (credits >= 500) return 85;
  if (credits >= 100) return 90;
  return 100;
}

const PLANS = {
  starter: {
    name: "Starter — 1 Credit",
    description: "For quick one-off tasks.",
    unit_amount: 100, // $1.00
    quantity: 1,
    credits: 1,
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

    let plan: "starter" | "velopack" = "starter";
    let credits = 20;
    try {
      const body = await request.json();
      if (body?.plan === "velopack") {
        plan = "velopack";
        const requested = typeof body?.credits === "number" ? body.credits : 20;
        credits = Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, Math.round(requested)));
      }
    } catch {
      // default to starter
    }

    const logoUrl = `${baseUrlClean}/logo-png.png`;

    let lineItems: Stripe.Checkout.SessionCreateParams["line_items"];
    let successUrl: string;
    const metadata: Record<string, string> = { plan, userId };
    if (orgId && orgId.trim()) metadata.organizationId = orgId;

    if (plan === "starter") {
      const config = PLANS.starter;
      lineItems = [
        {
          price_data: {
            currency: "usd" as const,
            product_data: {
              name: config.name,
              description: config.description,
            },
            unit_amount: config.unit_amount,
          },
          quantity: config.quantity,
        },
      ];
      successUrl = `${baseUrlClean}/success?session_id={CHECKOUT_SESSION_ID}&plan=starter`;
    } else {
      const centsPerCredit = getCentsPerCredit(credits);
      const description =
        credits >= 100
          ? "Volume discount applied. Best value for teams."
          : "Pay-as-you-go credits.";
      metadata.credits = String(credits);
      lineItems = [
        {
          price_data: {
            currency: "usd" as const,
            product_data: {
              name: `VeloPack — ${credits} Credits`,
              description,
            },
            unit_amount: centsPerCredit,
          },
          quantity: credits,
        },
      ];
      successUrl = `${baseUrlClean}/success?session_id={CHECKOUT_SESSION_ID}&plan=velopack&credits=${credits}`;
    }

    const sessionParams = {
      mode: "payment" as const,
      client_reference_id: userId,
      metadata,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: baseUrlClean,
      payment_intent_data: {
        statement_descriptor: "VELODOC",
      },
      branding_settings: {
        display_name: "VeloDoc",
        logo: { type: "url" as const, url: logoUrl },
      },
    };

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

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
