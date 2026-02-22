"use client";

import { Truck, Scale } from "lucide-react";

const CASE_STUDIES = [
  {
    icon: Truck,
    title: "How a National Logistics Firm Saved 40% on Data Entry",
    outcome: "40% reduction in manual entry · 12,000 BOLs/month",
    body: [
      "A national freight operator was spending 80+ hours per week re-typing data from bills of lading and rate confirmations into their TMS. Legacy OCR tools failed on handwritten fields and multi-format documents, forcing staff to correct almost every record.",
      "After deploying VeloDoc, the team connected PDFs from email and carrier portals to a single extraction pipeline. The AI Architect normalizes vendor names, dates, weights, and rates regardless of layout—so data lands in their system ready for reconciliation. Manual touchpoints dropped by 40% in the first quarter.",
      "Today they process over 12,000 BOLs per month through VeloDoc, with exports feeding directly into Excel and their operations dashboard. The same workflow is being piloted for purchase orders and proof-of-delivery documents.",
    ],
  },
  {
    icon: Scale,
    title: "How a Legal Operations Team Cut Contract Review Time in Half",
    outcome: "50% faster contract review · Enterprise-grade security",
    body: [
      "A mid-size legal department was drowning in multi-page vendor contracts and amendments. Extracting key terms—renewal dates, liability caps, termination clauses—required junior staff to read and summarize each document by hand, creating bottlenecks before counsel could review.",
      "VeloDoc’s AI Architect was trained on their contract taxonomy. Now, when a new agreement is uploaded, the system returns structured data: parties, effective dates, key obligations, and critical dates in a consistent schema. Legal ops gets a first-pass summary in seconds instead of days.",
      "The team has processed thousands of pages through VeloDoc with full audit trails. Because extraction runs in a secure, isolated pipeline with 256-bit encryption and no data retention for training, they met compliance requirements for confidential documents and rolled the tool out across the department.",
    ],
  },
] as const;

export function CaseStudies() {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-bold text-white text-center mb-3">
        Case Studies
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        Deep dives into how teams use VeloDoc to eliminate manual work and scale document intelligence.
      </p>
      <div className="space-y-10 max-w-3xl mx-auto">
        {CASE_STUDIES.map(({ icon: Icon, title, outcome, body }) => (
          <article
            key={title}
            className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-teal-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white leading-snug">
                  {title}
                </h3>
                <p className="text-teal-accent/90 text-sm font-medium mt-1">
                  {outcome}
                </p>
              </div>
            </div>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              {body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
