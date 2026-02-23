"use client";

import Link from "next/link";
import { ClipboardList, FlaskConical, Shield, FileHeart, Check, X } from "lucide-react";

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "Patient intake forms",
    description: "Extract demographics, chief complaint, and history from intake PDFs. Structured data flows into your EHR or practice management system.",
    bento: "large" as const,
  },
  {
    icon: FlaskConical,
    title: "Lab results",
    description: "Parse lab reports and reference ranges into consistent fields. Cut down on manual entry and reduce transcription errors.",
    bento: "medium" as const,
  },
  {
    icon: FileHeart,
    title: "Secure health records",
    description: "Process referrals, discharge summaries, and clinical notes. HIPAA-conscious workflows with encryption and access controls.",
    bento: "medium" as const,
  },
  {
    icon: Shield,
    title: "Institutional precision",
    description: "Enterprise security and audit trails. Your data stays protected and compliant from upload to export.",
    bento: "small" as const,
  },
] as const;

const COMPARE_ROWS = [
  { aspect: "Intake processing", manual: "Manual typing into EHR", velodoc: "Structured extraction into your system" },
  { aspect: "Lab data entry", manual: "Transcription errors & delays", velodoc: "Consistent fields, fewer errors" },
  { aspect: "Record review", manual: "Page-by-page reading", velodoc: "Key data extracted and searchable" },
  { aspect: "Compliance", manual: "Ad hoc checklists", velodoc: "HIPAA-conscious, audit-ready workflows" },
] as const;

export default function MedicalSolutionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        {/* Hero */}
        <header className="text-center mb-16">
          <span className="inline-block rounded-full bg-teal-accent/10 border border-teal-accent/40 px-4 py-1.5 text-sm font-semibold text-teal-accent mb-6">
            HIPAA-Compliant
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Medical & health records
          </h1>
          <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Patient intake forms, lab results, and secure health records—structured with institutional precision so your team can focus on care, not data entry.
          </p>
        </header>

        {/* How it Works — Bento */}
        <section className="mb-20">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">How it works for Medical</h2>
          <p className="text-slate-400 text-sm text-center mb-8 max-w-xl mx-auto">
            Purpose-built for patient intake, labs, and clinical documentation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            {HOW_IT_WORKS.map(({ icon: Icon, title, description, bento }) => (
              <article
                key={title}
                className={`${CARD_CLASS} flex flex-col transition-colors hover:border-teal-accent/40 ${
                  bento === "large" ? "md:col-span-2" : bento === "small" ? "md:col-span-1" : "md:col-span-1"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-teal-accent/10 flex items-center justify-center mb-4 shrink-0 text-teal-accent">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Compare VeloDoc */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">Compare VeloDoc</h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            How we outperform manual data entry in healthcare.
          </p>
          <div className={`${CARD_CLASS} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-4 text-slate-400 font-medium text-sm uppercase tracking-wider">Workflow</th>
                    <th className="py-4 px-4 text-slate-400 font-medium text-sm uppercase tracking-wider">Manual entry</th>
                    <th className="py-4 px-4 text-teal-accent font-medium text-sm uppercase tracking-wider">VeloDoc</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map(({ aspect, manual, velodoc }) => (
                    <tr key={aspect} className="border-b border-white/5 last:border-0">
                      <td className="py-4 px-4 text-white font-medium">{aspect}</td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        <span className="inline-flex items-center gap-2">
                          <X className="w-4 h-4 text-red-400/80 shrink-0" aria-hidden />
                          {manual}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-teal-accent/90 text-sm">
                        <span className="inline-flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0" aria-hidden />
                          {velodoc}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-teal-accent hover:bg-lime-accent text-petroleum px-6 py-3 text-sm font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
