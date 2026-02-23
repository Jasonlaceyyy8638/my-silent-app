"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Clock, Shield } from "lucide-react";

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

const BLOCKS = [
  {
    icon: Target,
    title: "What We Do",
    description:
      "Transforming unstructured document chaos into high-velocity business data. Invoices, contracts, BOLs, and records become structured, queryable assets in seconds.",
  },
  {
    icon: Clock,
    title: "How We Help",
    description:
      "Recovering thousands of man-hours by eliminating manual data entry. Teams ship faster, auditors get clean trails, and operations scale without adding headcount.",
  },
  {
    icon: Shield,
    title: "Our Focus",
    description:
      "Absolute precision, institutional speed, and uncompromising security. Enterprise-grade extraction with audit-ready output and compliance in mind.",
  },
] as const;

export function AboutSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
        The AI Architects
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        We turn document chaos into business velocity.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {BLOCKS.map(({ icon: Icon, title, description }) => (
          <div key={title} className={`${CARD_CLASS} p-6 sm:p-8 flex flex-col`}>
            <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center mb-4 text-teal-accent shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed flex-1">{description}</p>
          </div>
        ))}
      </div>
    </>
  );

  if (!mounted) {
    return <section className="mb-14">{content}</section>;
  }

  return (
    <motion.section
      initial={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14"
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
        The AI Architects
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        We turn document chaos into business velocity.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {BLOCKS.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`${CARD_CLASS} p-6 sm:p-8 flex flex-col`}
          >
            <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center mb-4 text-teal-accent shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed flex-1">{description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
