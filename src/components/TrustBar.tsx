"use client";

import { Truck, Wrench, Scale, GraduationCap, ShoppingBag } from "lucide-react";

const INDUSTRIES = [
  { id: "logistics", label: "Logistics", icon: Truck },
  { id: "service", label: "Garage Door / Service", icon: Wrench },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "retail", label: "Retail", icon: ShoppingBag },
] as const;

export function TrustBar() {
  return (
    <section className="mb-14 py-8 border-y border-white/10" aria-label="Industries we serve">
      <p className="text-center text-slate-500 text-xs font-semibold uppercase tracking-widest mb-6">
        Trusted across industries
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {INDUSTRIES.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-6 py-5 min-w-[100px] transition-all duration-300 hover:border-teal-accent/40 hover:bg-teal-accent/5"
            title={label}
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-petroleum/60 text-slate-400 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:text-teal-accent group-hover:bg-teal-accent/10">
              <Icon className="w-6 h-6" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 transition-colors duration-300 group-hover:text-teal-accent/90 text-center leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
