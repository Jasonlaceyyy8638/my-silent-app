import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addCredits } from "@/lib/credits";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const CREDITS_BY_PLAN: Record<string, number> = {
  starter: 1,
  velopack: 20,
};

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
  const amount = CREDITS_BY_PLAN[plan] ?? 1;

  try {
    await addCredits(userId, amount);
  } catch (err) {
    console.error("Webhook addCredits error:", err);
    return NextResponse.json(
      { error: "Failed to add credits" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
