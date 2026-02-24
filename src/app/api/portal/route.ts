import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getSupabase } from "@/lib/supabase";

const RETURN_URL = "https://velodoc.app/dashboard";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * POST: Create a Stripe Customer Portal (billing portal) session.
 * - Authenticates the user (Clerk); uses Supabase server client (getSupabase()) to fetch stripe_customer_id from profiles by user_id.
 * - Creates portal session via stripe.billingPortal.sessions.create({ customer, return_url }).
 * - Returns { url } for frontend redirect.
 * Brand & support: Portal branding is managed by Alissa Wilson in Stripe Dashboard. Set support contact (Sharon Ferguson — support@velodoc.app) in Stripe Dashboard → Billing → Customer portal.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to manage your subscription." },
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

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 500 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Portal: profiles fetch error", profileError);
    return NextResponse.json(
      { error: "Failed to load billing profile." },
      { status: 500 }
    );
  }

  const stripeCustomerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id?.trim();
  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Complete a purchase first to manage your subscription." },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: RETURN_URL,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create portal session." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal: billingPortal.sessions.create error", err);
    return NextResponse.json(
      { error: "Failed to open billing portal." },
      { status: 500 }
    );
  }
}
