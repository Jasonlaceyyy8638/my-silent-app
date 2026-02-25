"use client";

import Link from "next/link";
import type { MePlan } from "@/app/api/me/route";

const PLAN_CREDITS: Record<MePlan, number> = {
  free: 5,
  starter: 25,
  pro: 150,
  enterprise: 500,
};

export type CreditShieldProps = {
  /** Credits remaining (from profiles.credits_remaining or /api/credits). */
  creditsRemaining: number | null;
  plan: MePlan;
};

/**
 * Credit Shield: progress bar showing credits used vs plan allowance.
 * When creditsRemaining <= 0, callers should disable Upload/Sync and show "Out of Credits — Upgrade Now".
 */
export function CreditShield({ creditsRemaining, plan }: CreditShieldProps) {
  const allowance = PLAN_CREDITS[plan] ?? 25;
  const remaining = creditsRemaining ?? 0;
  const used = Math.max(0, allowance - remaining);
  const displayUsed = Math.min(used, allowance);
  const percent = allowance > 0 ? Math.min(100, (displayUsed / allowance) * 100) : 0;

  if (creditsRemaining === null) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
        <p className="text-slate-500 text-xs">Loading credits…</p>
      </div>
    );
  }

  const outOfCredits = remaining <= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          Architectural Credits
        </span>
        <span className="text-white font-semibold tabular-nums text-sm">
          {displayUsed} / {allowance} used
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-accent transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {outOfCredits && (
        <p className="mt-2 text-amber-200/90 text-xs">
          Out of credits.{" "}
          <Link
            href="/pricing"
            className="text-teal-accent hover:text-[#7dd3fc] font-medium underline"
          >
            Upgrade now
          </Link>
        </p>
      )}
    </div>
  );
}

/** Helper: true when credits_remaining <= 0 so Upload/Sync should be disabled. */
export function isOutOfCredits(creditsRemaining: number | null): boolean {
  return creditsRemaining !== null && creditsRemaining <= 0;
}
