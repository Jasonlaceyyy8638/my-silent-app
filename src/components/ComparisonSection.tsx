"use client";

import { Check, X } from "lucide-react";

const ROWS = [
  { feature: "AI Architecting", velodoc: true, competitor: false },
  { feature: "Industry-specific logic (Logistics / Home Services)", velodoc: true, competitor: false },
  { feature: "Bulk export to QuickBooks & Excel", velodoc: true, competitor: false },
  { feature: "Enterprise security & compliance", velodoc: true, competitor: false },
  { feature: "Generic text dumping", velodoc: false, competitor: true },
  { feature: "Manual cleanup required", velodoc: false, competitor: true },
  { feature: "High error rates", velodoc: false, competitor: true },
  { feature: "Basic security only", velodoc: false, competitor: true },
] as const;

export function ComparisonSection() {
  return (
    <section className="mb-14">
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
        Why VeloDoc?
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        See how AI-powered extraction compares to traditional OCR.
      </p>
      <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 overflow-hidden max-w-3xl mx-auto shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20 bg-white/5">
              <th className="py-4 px-5 text-slate-400 font-semibold text-sm uppercase tracking-wider w-[45%]">
                Capability
              </th>
              <th className="py-4 px-5 text-teal-accent font-semibold text-sm uppercase tracking-wider text-center">
                VeloDoc
              </th>
              <th className="py-4 px-5 text-slate-400 font-semibold text-sm uppercase tracking-wider text-center">
                Traditional OCR
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ feature, velodoc, competitor }) => (
              <tr key={feature} className="border-b border-white/10 last:border-0">
                <td className="py-4 px-5 text-slate-200 text-sm">{feature}</td>
                <td className="py-4 px-5 text-center">
                  {velodoc ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-accent/20 text-teal-accent" aria-label="Yes">
                      <Check className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-slate-500" aria-label="No">
                      <span className="sr-only">—</span>
                    </span>
                  )}
                </td>
                <td className="py-4 px-5 text-center">
                  {competitor ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-400" aria-label="Typical of Traditional OCR">
                      <X className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-sm" aria-hidden>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
