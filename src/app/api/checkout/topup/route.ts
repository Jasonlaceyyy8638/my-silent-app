import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

const DEFAULT_TOPUP_CREDITS = 20;
const CENTS_PER_CREDIT = 100;

/**
 * POST /api/checkout/topup
 * Body: { credits?: number }
 * Creates a one-time Stripe Checkout session for credit top-up. Credits are added to profiles.credits_topup_remaining (and credits_remaining) on success via webhook.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 500 }
    );
  }

  let credits = DEFAULT_TOPUP_CREDITS;
  try {
    const body = await request.json();
    if (body?.credits != null) {
      const n = Math.round(Number(body.credits));
      if (n >= 1 && n <= 1000) credits = n;
    }
  } catch {
    // use default
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    request.headers.get("referer")?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const baseUrlClean = baseUrl.replace(/\/$/, "");

  const unitAmount = CENTS_PER_CREDIT;
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    client_reference_id: userId,
    metadata: {
      userId,
      topup: "true",
      credits: String(credits),
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "VeloDoc Credit Top-Up",
            description: `${credits} extraction credits — added to your balance.`,
          },
          unit_amount: unitAmount,
        },
        quantity: credits,
      },
    ],
    success_url: `${baseUrlClean}/dashboard?topup=success`,
    cancel_url: `${baseUrlClean}/dashboard`,
  };

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout/topup]", err);
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
