"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

const MIN_BULK_CREDITS = 20;
const MAX_BULK_CREDITS = 10000;

/** Tiers: 20–99 $1.00; 100–499 10%; 500–999 15%; 1,000–4,999 20%; 5,000–10,000 35% ($0.65). */
function getBulkPrice(credits: number): {
  total: number;
  perCredit: number;
  savingsPercentage: number;
} {
  const c = Math.max(MIN_BULK_CREDITS, Math.min(MAX_BULK_CREDITS, Math.round(credits)));
  let perCredit: number;
  let savingsPercentage: number;
  if (c >= 5000) {
    perCredit = 0.65;
    savingsPercentage = 35;
  } else if (c >= 1000) {
    perCredit = 0.8;
    savingsPercentage = 20;
  } else if (c >= 500) {
    perCredit = 0.85;
    savingsPercentage = 15;
  } else if (c >= 100) {
    perCredit = 0.9;
    savingsPercentage = 10;
  } else {
    perCredit = 1.0;
    savingsPercentage = 0;
  }
  const total = Math.round(perCredit * c * 100) / 100;
  return { total, perCredit, savingsPercentage };
}

type Plan = "starter" | "velopack";

export default function PricingPage() {
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [bulkCredits, setBulkCredits] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = useCallback(
    async (plan: Plan, credits?: number) => {
      setError(null);
      setCheckoutPlan(plan);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            plan === "velopack" ? { plan, credits: credits ?? bulkCredits } : { plan }
          ),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Checkout failed.");
        if (data.url) window.location.href = data.url;
        else throw new Error("No checkout URL returned.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Checkout failed.");
        setCheckoutPlan(null);
      }
    },
    [bulkCredits]
  );

  const bulkPrice = getBulkPrice(bulkCredits);
  const savingsLabel =
    bulkPrice.savingsPercentage > 0
      ? `You are saving ${bulkPrice.savingsPercentage}% on ${bulkCredits.toLocaleString()} credits.`
      : "Save up to 35% at 100+ credits.";

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Simple pricing
          </h1>
          <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Pay per extraction. Scale with volume discounts.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-14">
          <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 flex flex-col border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
            <h2 className="text-lg font-semibold text-white">Starter</h2>
            <p className="mt-1 text-3xl font-bold text-white">$1.00</p>
            <p className="text-slate-300 text-sm mt-1">1 Credit</p>
            <p className="text-slate-400 text-sm mt-2">For quick one-off tasks.</p>
            <SignedIn>
              <button
                type="button"
                onClick={() => handleCheckout("starter")}
                disabled={checkoutPlan !== null}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                {checkoutPlan === "starter" ? "Redirecting…" : "Get Starter"}
              </button>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Sign in to buy
              </Link>
            </SignedOut>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 flex flex-col border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] relative">
            <span className="absolute -top-2.5 right-6 rounded-full bg-lime-accent px-2.5 py-0.5 text-xs font-medium text-petroleum">
              Bulk discount
            </span>
            <h2 className="text-lg font-semibold text-white">VeloPack</h2>
            <p className="text-slate-400 text-sm mt-1">
              Choose 20–10,000 credits. {savingsLabel}
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2 gap-4">
                  <label htmlFor="bulk-credits" className="text-slate-300 font-medium">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={MIN_BULK_CREDITS}
                    max={MAX_BULK_CREDITS}
                    value={Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, bulkCredits))}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v))
                        setBulkCredits(
                          Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, v))
                        );
                    }}
                    className="w-20 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-right font-mono text-sm font-semibold text-teal-accent tabular-nums focus:border-teal-accent focus:outline-none focus:ring-1 focus:ring-teal-accent"
                  />
                </div>
                <input
                  id="bulk-credits"
                  type="range"
                  min={MIN_BULK_CREDITS}
                  max={MAX_BULK_CREDITS}
                  step={1}
                  value={Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, bulkCredits))}
                  onChange={(e) =>
                    setBulkCredits(
                      Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, Number(e.target.value)))
                    )
                  }
                  className="w-full h-2 rounded-full appearance-none bg-slate-700 accent-teal-accent cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>{MIN_BULK_CREDITS}</span>
                  <span>{MAX_BULK_CREDITS.toLocaleString()}</span>
                </div>
              </div>
              {bulkPrice.savingsPercentage > 0 && (
                <p className="text-teal-accent text-sm font-medium">
                  You are saving {bulkPrice.savingsPercentage}% on {Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, bulkCredits)).toLocaleString()} credits.
                </p>
              )}
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                  ${bulkPrice.total.toFixed(2)}
                </span>
                {bulkPrice.savingsPercentage > 0 && (
                  <span className="rounded bg-teal-accent/20 text-teal-accent text-xs font-medium px-2 py-0.5">
                    {bulkPrice.savingsPercentage}% off
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs">
                ${bulkPrice.perCredit.toFixed(2)}/credit
                {bulkPrice.savingsPercentage > 0 && " (volume rate)"}
              </p>
              <SignedIn>
                <button
                  type="button"
                  onClick={() => handleCheckout("velopack", Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, bulkCredits)))}
                  disabled={checkoutPlan !== null}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-3 text-sm font-semibold disabled:opacity-70 disabled:pointer-events-none transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {checkoutPlan === "velopack" ? "Redirecting…" : `Get ${Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, bulkCredits)).toLocaleString()} Credits`}
                </button>
              </SignedIn>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-3 text-sm font-semibold transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Sign in to buy {Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, bulkCredits)).toLocaleString()} credits
                </Link>
              </SignedOut>
            </div>
            <p className="mt-6 pt-6 border-t border-white/10 text-slate-500 text-xs text-center">
              Need more than 10,000 credits?{" "}
              <a
                href="mailto:sales@velodoc.app?subject=VeloPack%20credits%20inquiry"
                className="text-teal-accent hover:underline font-medium"
              >
                Contact Jason Lacey — Sales
              </a>
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-300 text-center mb-6" role="alert">
            {error}
          </p>
        )}

        <div className="text-center">
          <Link
            href="/features"
            className="text-slate-400 hover:text-teal-accent text-sm font-medium transition-colors"
          >
            Compare features →
          </Link>
        </div>
      </div>
    </main>
  );
}
