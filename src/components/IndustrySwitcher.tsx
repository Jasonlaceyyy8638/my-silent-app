"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Wrench, Scale, Stethoscope, Banknote } from "lucide-react";

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
      "Invoices and part number extraction",
      "SKU and quantity verification",
      "Vendor line items (Amarr, Clopay, etc.)",
      "Purchase order matching",
    ],
  },
  {
    id: "legal",
    label: "Legal",
    icon: Scale,
    benefits: [
      "Contract metadata extraction",
      "Deposition summaries and key quotes",
      "Discovery automation and document review",
      "Audit-ready structured output",
    ],
  },
  {
    id: "medical",
    label: "Medical",
    icon: Stethoscope,
    benefits: [
      "Patient intake forms and demographics",
      "Lab results and reference ranges",
      "HIPAA-compliant data handling",
      "Secure health records extraction",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: Banknote,
    benefits: [
      "Bank statements and transaction data",
      "Mortgage application packet extraction",
      "Portfolio consolidation and reporting",
      "Regulatory-ready exports",
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

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
        {INDUSTRIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold transition-all duration-300 border ${
              active === id
                ? "bg-teal-accent text-petroleum border-teal-accent shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border-white/20"
            }`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className={`max-w-2xl mx-auto ${CARD_CLASS}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row sm:items-start gap-6"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-teal-accent/20 flex items-center justify-center text-teal-accent border border-teal-accent/30">
              <current.icon className="w-7 h-7" />
            </div>
            <div className="min-w-0">
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
