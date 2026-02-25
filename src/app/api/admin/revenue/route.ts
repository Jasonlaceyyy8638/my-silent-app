import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAdminUser } from "@/lib/admin-auth";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export type RevenueResponse = {
  weekly: number;
  monthly: number;
  yearly: number;
  trend: Array<{ date: string; amount: number }>;
};

/**
 * GET /api/admin/revenue
 * Returns revenue overview from Stripe (paid invoices). Only for primary admin.
 * Amounts in dollars (Stripe amounts are cents).
 */
export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured", weekly: 0, monthly: 0, yearly: 0, trend: [] },
      { status: 503 }
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const weekAgo = now - 7 * 24 * 3600;
  const monthAgo = now - 30 * 24 * 3600;
  const yearAgo = now - 365 * 24 * 3600;

  try {
    const allInvoices: Stripe.Invoice[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const list = await stripe.invoices.list({
        status: "paid",
        created: { gte: yearAgo },
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      allInvoices.push(...list.data);
      hasMore = list.has_more;
      if (list.data.length) {
        startingAfter = list.data[list.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    const toDollars = (cents: number) => (cents ?? 0) / 100;

    let weekly = 0;
    let monthly = 0;
    let yearly = 0;
    const byDay: Record<string, number> = {};

    for (const inv of allInvoices) {
      const created = inv.created ?? 0;
      const amount = inv.amount_paid ?? 0;
      const dollars = toDollars(amount);
      yearly += dollars;
      if (created >= monthAgo) monthly += dollars;
      if (created >= weekAgo) weekly += dollars;
      const dateKey = new Date(created * 1000).toISOString().slice(0, 10);
      byDay[dateKey] = (byDay[dateKey] ?? 0) + dollars;
    }

    const sortedDates = Object.keys(byDay).sort();
    const trend = sortedDates.map((date) => ({
      date,
      amount: byDay[date] ?? 0,
    }));

    const payload: RevenueResponse = {
      weekly: Math.round(weekly * 100) / 100,
      monthly: Math.round(monthly * 100) / 100,
      yearly: Math.round(yearly * 100) / 100,
      trend,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[admin/revenue]", err);
    return NextResponse.json(
      { error: "Failed to fetch revenue", weekly: 0, monthly: 0, yearly: 0, trend: [] },
      { status: 500 }
    );
  }
}
