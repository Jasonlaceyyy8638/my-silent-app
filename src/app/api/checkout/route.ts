import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const PLANS = {
  starter: {
    name: "Starter — 1 Credit",
    description: "For quick one-off tasks.",
    unit_amount: 100, // $1.00
    quantity: 1,
    credits: 1,
  },
  velopack: {
    name: "VeloPack — 20 Credits",
    description: "Best value for businesses.",
    unit_amount: 1000, // $10.00
    quantity: 1,
    credits: 20,
  },
} as const;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
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

    let plan: keyof typeof PLANS = "starter";
    try {
      const body = await request.json();
      if (body?.plan === "velopack") plan = "velopack";
    } catch {
      // default to starter
    }

    const config = PLANS[plan];

    const logoUrl = `${baseUrlClean}/logo-png.png`;

    const sessionParams = {
      mode: "payment" as const,
      client_reference_id: userId,
      metadata: { plan, userId },
      line_items: [
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
      ],
      success_url: `${baseUrlClean}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
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
