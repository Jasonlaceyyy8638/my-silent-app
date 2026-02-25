"use client";

import Link from "next/link";
import { Check, Minus, ShoppingCart, LayoutGrid } from "lucide-react";

const ROWS = [
  {
    feature: "Automated Monday Reports",
    velodoc: "Architected Precision",
    others: "Manual CSV Exports",
  },
  {
    feature: "Institutional Allowance",
    velodoc: "500+ Monthly Credits",
    others: "Pay-Per-Click Friction",
  },
  {
    feature: "Logistics Native AI",
    velodoc: "Built by 1UpLogistics",
    others: "Generic OCR Engine",
  },
  {
    feature: "Carrier Portal Sync",
    velodoc: "Full History Tracking",
    others: "Single-Doc Processing",
  },
  {
    feature: "Hybrid Credit Model",
    velodoc: "Allowance + On-Demand Top-ups",
    others: "Locked Tiers",
  },
] as const;

const COMPETITORS = ["Dext", "AutoEntry", "Nanonets"] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export function WhyVelodocCompetitors() {
  return (
    <section className="mb-14" aria-labelledby="why-velodoc-heading">
      <h2
        id="why-velodoc-heading"
        className="text-2xl sm:text-3xl font-bold text-white text-center mb-2"
      >
        Why VeloDoc?
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-8">
        High-end logistics comparison — institutional precision vs. manual workflows.
      </p>

      {/* Mobile: stacked 5-point cards */}
      <div className="md:hidden space-y-4 max-w-md mx-auto mb-8">
        {ROWS.map((row) => (
          <div
            key={row.feature}
            className={`${CARD_CLASS} p-4 overflow-hidden`}
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-3">
              {row.feature}
            </p>
            <div className="flex items-start gap-3 mb-3">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-accent/20 text-teal-accent shrink-0 mt-0.5"
                aria-hidden
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="text-teal-accent font-medium text-sm">
                {row.velodoc}
              </span>
            </div>
            <div className="flex items-start gap-3 pl-0">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-600/40 text-slate-500 shrink-0 mt-0.5"
                aria-hidden
              >
                <Minus className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="text-slate-500 text-sm">{row.others}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: 5-point table with VeloDoc + Dext, AutoEntry, Nanonets columns */}
      <div
        className={`${CARD_CLASS} overflow-hidden max-w-5xl mx-auto hidden md:block`}
      >
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-white/20 bg-slate-900/60">
                <th className="py-4 px-4 text-slate-400 font-semibold uppercase tracking-wider w-[20%]">
                  Feature
                </th>
                <th className="py-4 px-4 text-center border-l border-white/10 bg-teal-accent/10 w-[26%]">
                  <span className="text-teal-accent font-semibold uppercase tracking-wider">
                    VeloDoc
                  </span>
                </th>
                {COMPETITORS.map((name) => (
                  <th
                    key={name}
                    className="py-4 px-3 text-center border-l border-white/10 bg-slate-800/50 w-[18%]"
                  >
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs">
                      {name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {ROWS.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-white/10 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-4 font-medium text-slate-200">
                    {row.feature}
                  </td>
                  <td className="py-4 px-4 border-l border-teal-accent/20 bg-teal-accent/5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1.5">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-accent/20 text-teal-accent shrink-0"
                        aria-label="VeloDoc"
                      >
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      </span>
                      <span className="text-teal-accent font-medium text-sm">
                        {row.velodoc}
                      </span>
                    </div>
                  </td>
                  {COMPETITORS.map((name) => (
                    <td
                      key={name}
                      className="py-4 px-3 border-l border-white/10 bg-slate-800/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-1.5">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-600/50 text-slate-500 shrink-0"
                          aria-hidden
                        >
                          <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </span>
                        <span className="text-slate-500 text-xs leading-tight">
                          {row.others}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-accent px-6 py-3.5 text-sm font-semibold text-petroleum hover:bg-teal-accent/90 transition-colors shadow-lg border border-teal-accent/30"
        >
          <ShoppingCart className="w-4 h-4" aria-hidden />
          Buy Credits
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
        >
          <LayoutGrid className="w-4 h-4" aria-hidden />
          Create Workspace
        </Link>
      </div>
    </section>
  );
}
