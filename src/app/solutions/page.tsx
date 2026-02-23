"use client";

import Link from "next/link";
import { Truck, Scale, GraduationCap, ShoppingBag, Building2 } from "lucide-react";

const SOLUTIONS = [
  {
    icon: Truck,
    title: "Logistics & Freight",
    id: "logistics",
    description: "Extract BOLs, rate confirmations, and shipping documents at scale. Reduce manual entry by 40%+.",
  },
  {
    icon: Scale,
    title: "Legal & Contract Management",
    id: "legal",
    description: "Structure multi-page contracts for key terms, dates, and obligations. Enterprise-grade security.",
  },
  {
    icon: Building2,
    title: "Finance & Accounting",
    id: "finance",
    description: "Turn invoices and statements into structured data for reconciliation and reporting.",
  },
  {
    icon: GraduationCap,
    title: "Education & Research",
    id: "education",
    description: "Process transcripts, syllabi, and research records. Instant structure, no retyping.",
  },
  {
    icon: ShoppingBag,
    title: "Retail & Procurement",
    id: "retail",
    description: "Vendor invoices, POs, and line items—extracted and ready for your ERP or spreadsheets.",
  },
] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Solutions by industry
          </h1>
          <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            From logistics to legal, VeloDoc adapts to your documents and workflows.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {SOLUTIONS.map(({ icon: Icon, title, id, description }) => (
            <section
              key={title}
              id={id}
              className={`${CARD_CLASS} flex flex-col gap-4 scroll-mt-24`}
            >
              <div className="w-14 h-14 rounded-xl bg-teal-accent/10 flex items-center justify-center shrink-0 text-teal-accent">
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
                <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
              </div>
            </section>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-6 py-3 text-sm font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
