"use client";

import { Check, Minus } from "lucide-react";

const ROWS = [
  {
    feature: "Monday AM Reports",
    velodoc: "Fully Automated",
    others: "Manual Export Only",
  },
  {
    feature: "Monthly Allowance",
    velodoc: "25–500 Included",
    others: "Strict Pay-Per-Credit (e.g. AutoEntry)",
  },
  {
    feature: "Industry Voice",
    velodoc: "Built by 1UpLogistics",
    others: "Generic Software",
  },
] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export function WhyVelodocCompetitors() {
  return (
    <section className="mb-14" aria-labelledby="why-velodoc-heading">
      <h2 id="why-velodoc-heading" className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
        Why VeloDoc?
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-8">
        See how we compare to Dext, AutoEntry, and Nanonets.
      </p>

      {/* Desktop: table */}
      <div className={`${CARD_CLASS} overflow-hidden hidden md:block`}>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-left text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-white/20 bg-white/5">
                <th className="py-4 px-4 text-slate-400 font-semibold uppercase tracking-wider w-[28%]">
                  Feature
                </th>
                <th className="py-4 px-4 text-teal-accent font-semibold text-center w-[36%] bg-teal-accent/5 border-l border-[#22d3ee]/20">
                  VeloDoc
                </th>
                <th className="py-4 px-4 text-slate-400 font-semibold text-center w-[36%] border-l border-white/10">
                  Others
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-white/10 last:border-b-0">
                  <td className="py-4 px-4 font-medium text-slate-200">{row.feature}</td>
                  <td className="py-4 px-4 text-center border-l border-[#22d3ee]/20 bg-teal-accent/5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mx-auto mb-1.5" aria-hidden>
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                    <span className="block text-teal-accent font-medium text-sm">{row.velodoc}</span>
                  </td>
                  <td className="py-4 px-4 text-center border-l border-white/10">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-slate-500 shrink-0 mx-auto mb-1.5" aria-hidden>
                      <Minus className="w-4 h-4" />
                    </span>
                    <span className="block text-slate-400 text-sm">{row.others}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: feature cards (no cut-off) */}
      <div className="md:hidden space-y-4">
        {ROWS.map((row) => (
          <div
            key={row.feature}
            className={`${CARD_CLASS} p-4 overflow-hidden`}
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-3">
              {row.feature}
            </p>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0" aria-hidden>
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="text-teal-accent font-medium text-sm">{row.velodoc}</span>
            </div>
            <div className="flex items-center gap-3 pl-0">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-slate-500 shrink-0" aria-hidden>
                <Minus className="w-4 h-4" />
              </span>
              <span className="text-slate-400 text-sm break-words">{row.others}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
