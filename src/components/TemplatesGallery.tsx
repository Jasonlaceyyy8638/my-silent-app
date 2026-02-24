"use client";

import { motion } from "framer-motion";
import { Truck, Scale, FileText } from "lucide-react";

const TEMPLATES = [
  {
    id: "logistics",
    industry: "Logistics",
    docType: "BOLs",
    icon: Truck,
    examples: ["Bill of Lading", "Rate confirmations", "Carrier load sheets", "Freight documentation"],
    description: "Turn shipping and freight paperwork into structured load data, carrier details, and dispatch-ready fields.",
  },
  {
    id: "legal",
    industry: "Legal",
    docType: "Contracts",
    icon: Scale,
    examples: ["MSAs & SOWs", "NDAs", "Lease agreements", "Employment contracts"],
    description: "Extract parties, dates, key terms, and obligations for contract management and audit trails.",
  },
  {
    id: "healthcare",
    industry: "Healthcare",
    docType: "Intake Forms",
    icon: FileText,
    examples: ["Patient intake", "Consent forms", "Registration packets", "Clinical questionnaires"],
    description: "Structure demographics, consent fields, and form data for EHR integration and compliance.",
  },
] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 p-6 sm:p-8 flex flex-col transition-all duration-300 hover:border-teal-accent/40";

export function TemplatesGallery() {
  return (
    <section className="mb-14" aria-labelledby="templates-heading">
      <h2 id="templates-heading" className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
        Templates by industry
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        More than invoices—BOLs, contracts, intake forms, and any paper-to-digital workflow.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {TEMPLATES.map(({ id, industry, docType, icon: Icon, examples, description }, i) => (
          <motion.article
            key={id}
            className={CARD_CLASS}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center text-teal-accent border border-teal-accent/30 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{industry}</p>
                <h3 className="text-lg font-semibold text-white">{docType}</h3>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{description}</p>
            <ul className="mt-auto space-y-1.5">
              {examples.map((ex) => (
                <li key={ex} className="flex items-center gap-2 text-slate-400 text-xs">
                  <span className="w-1 h-1 rounded-full bg-teal-accent/80 shrink-0" aria-hidden />
                  {ex}
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
