"use client";

import { Check, Minus } from "lucide-react";

const ROWS = [
  {
    feature: "Monday AM Reports",
    velodoc: "Fully Automated",
    dext: "Manual Export",
    autoEntry: "Manual Export",
    nanonets: "Custom",
  },
  {
    feature: "Industry Background",
    velodoc: "Built by 1UpLogistics — industry voice",
    dext: "Generic software",
    autoEntry: "Generic software",
    nanonets: "Generic software",
  },
  {
    feature: "QuickBooks Sync",
    velodoc: "1-Click Architectural Bridge",
    dext: "Standard scanning",
    autoEntry: "Standard scanning",
    nanonets: "Standard scanning",
  },
  {
    feature: "Pricing",
    velodoc: "$29 / $79 / $249 — clear tiers",
    dext: "Hidden fees",
    autoEntry: "Hidden fees",
    nanonets: "Custom enterprise quotes",
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

      <div className={`${CARD_CLASS} overflow-hidden`}>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-white/20 bg-white/5">
                <th className="py-4 px-4 text-slate-400 font-semibold uppercase tracking-wider w-[22%]">
                  Feature
                </th>
                <th className="py-4 px-4 text-teal-accent font-semibold text-center w-[26%] bg-teal-accent/5 border-l border-[#22d3ee]/20">
                  VeloDoc
                </th>
                <th className="py-4 px-4 text-slate-400 font-semibold text-center w-[17%]">
                  Dext
                </th>
                <th className="py-4 px-4 text-slate-400 font-semibold text-center w-[17%] border-l border-white/10">
                  AutoEntry
                </th>
                <th className="py-4 px-4 text-slate-400 font-semibold text-center w-[18%] border-l border-white/10">
                  Nanonets
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
                    <span className="block text-teal-accent font-medium text-xs sm:text-sm">{row.velodoc}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-slate-500 shrink-0 mx-auto mb-1.5" aria-hidden>
                      <Minus className="w-4 h-4" />
                    </span>
                    <span className="block text-slate-400 text-xs sm:text-sm">{row.dext}</span>
                  </td>
                  <td className="py-4 px-4 text-center border-l border-white/10">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-slate-500 shrink-0 mx-auto mb-1.5" aria-hidden>
                      <Minus className="w-4 h-4" />
                    </span>
                    <span className="block text-slate-400 text-xs sm:text-sm">{row.autoEntry}</span>
                  </td>
                  <td className="py-4 px-4 text-center border-l border-white/10">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-slate-500 shrink-0 mx-auto mb-1.5" aria-hidden>
                      <Minus className="w-4 h-4" />
                    </span>
                    <span className="block text-slate-400 text-xs sm:text-sm">{row.nanonets}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
