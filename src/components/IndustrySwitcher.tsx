"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Wrench } from "lucide-react";

const INDUSTRIES = [
  {
    id: "logistics",
    label: "Logistics",
    icon: Truck,
    benefits: [
      "BOL processing and rate confirmations",
      "Carrier and load data extraction",
      "Automated freight documentation",
      "Dispatch-ready structured output",
    ],
  },
  {
    id: "home",
    label: "Home Services",
    icon: Wrench,
    benefits: [
      "Part number extraction (Amarr, Clopay, etc.)",
      "Vendor invoice line items",
      "SKU and quantity verification",
      "Purchase order matching",
    ],
  },
] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 p-6 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export function IndustrySwitcher() {
  const [active, setActive] = useState<(typeof INDUSTRIES)[number]["id"]>("logistics");
  const current = INDUSTRIES.find((i) => i.id === active) ?? INDUSTRIES[0];

  return (
    <section className="mb-14">
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
        Industry-specific benefits
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        Switch industries to see what VeloDoc delivers for your vertical.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {INDUSTRIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
              active === id
                ? "bg-teal-accent text-petroleum shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white border border-white/20"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      <div className={`max-w-2xl mx-auto ${CARD_CLASS}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row sm:items-start gap-6"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-teal-accent/20 flex items-center justify-center text-teal-accent">
              <current.icon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{current.label}</h3>
              <ul className="space-y-2">
                {current.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-accent shrink-0" aria-hidden />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
