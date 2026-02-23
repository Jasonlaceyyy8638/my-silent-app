"use client";

import Link from "next/link";
import {
  FileUp,
  LayoutGrid,
  Download,
  Shield,
  Zap,
  FileSpreadsheet,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileUp,
    title: "Upload Any PDF",
    description: "Drop invoices, BOLs, contracts, or transcripts. No templates or formatting required.",
    bento: "medium" as const,
  },
  {
    icon: LayoutGrid,
    title: "AI Architect",
    description: "Context-aware extraction that understands structure and semantics, not just text.",
    bento: "medium" as const,
  },
  {
    icon: Download,
    title: "Export Everywhere",
    description: "Download as CSV or Excel. Integrations with QuickBooks, Zapier, and Google Drive coming soon.",
    bento: "medium" as const,
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "AES-256 at rest, TLS 1.2+ in transit, MFA via Clerk. Your data stays yours.",
    bento: "large" as const,
  },
  {
    icon: Zap,
    title: "Bulk Processing",
    description: "Buy 20 to 1,000 credits with volume discounts. Scale without friction.",
    bento: "small" as const,
  },
  {
    icon: FileSpreadsheet,
    title: "Structured Output",
    description: "Consistent schemas for vendor, total, date, and line items—ready for your systems.",
    bento: "small" as const,
  },
] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Built for the way you work
          </h1>
          <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Every feature is designed to eliminate manual data entry and scale with your team.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14 auto-rows-fr">
          {FEATURES.map(({ icon: Icon, title, description, bento }) => (
            <article
              key={title}
              className={`${CARD_CLASS} flex flex-col ${bento === "large" ? "md:col-span-2" : ""}`}
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-teal-accent/10 flex items-center justify-center shrink-0 text-teal-accent">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
                  <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-6 py-3 text-sm font-semibold transition-colors"
          >
            View pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
