"use client";

import { Zap, CheckCircle, Plug } from "lucide-react";

const BENEFITS = [
  {
    icon: Zap,
    title: "Institutional Speed",
    description: "Extract 100 pages in under 60 seconds. Batch process invoices, BOLs, and contracts without waiting.",
    bento: "large" as const,
  },
  {
    icon: CheckCircle,
    title: "Absolute Precision",
    description: "AI-powered verification of line items and part numbers. Amarr, Clopay, and vendor SKUs extracted correctly every time.",
    bento: "medium" as const,
  },
  {
    icon: Plug,
    title: "Seamless Ecosystem",
    description: "Direct exports to Excel, QuickBooks, and custom APIs. CSV and XLSX today; more integrations coming soon.",
    bento: "medium" as const,
  },
] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export function BenefitsBento() {
  return (
    <section className="mb-14">
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
        High-impact benefits
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        Built for scale, accuracy, and your existing stack.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {BENEFITS.map(({ icon: Icon, title, description, bento }) => (
          <article
            key={title}
            className={`${CARD_CLASS} flex flex-col ${bento === "large" ? "md:col-span-2" : ""}`}
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-teal-accent/10 flex items-center justify-center shrink-0 text-teal-accent">
                <Icon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
