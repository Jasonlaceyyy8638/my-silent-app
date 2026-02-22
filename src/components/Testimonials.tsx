"use client";

import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    role: "Service Pro (Garage Door Owner)",
    quote:
      "VeloDoc is a game-changer. It extracts Amarr and Clopay part numbers from my vendor invoices perfectly, saving me hours of manual inventory entry.",
  },
  {
    role: "Logistics Expert (Freight Dispatcher)",
    quote:
      "Handles our BOLs and rate confirmations with 99% accuracy. It's the best data extraction tool I've used in 10 years.",
  },
  {
    role: "Legal Assistant",
    quote:
      "I use the AI Architect for multi-page contracts. It finds exactly what matters in seconds, and the security is enterprise-grade.",
  },
  {
    role: "Academic Administrator",
    quote:
      "Processing school transcripts used to take a team. Now, VeloDoc architectures the data instantly.",
  },
] as const;

export function Testimonials() {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        Success Stories
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {TESTIMONIALS.map(({ role, quote }) => (
          <div
            key={role}
            className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30"
          >
            <Quote className="h-8 w-8 text-teal-accent/60 mb-3" aria-hidden />
            <p className="text-slate-200 text-sm leading-relaxed">{quote}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-teal-accent">
              {role}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
