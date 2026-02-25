"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Plug, Zap, FolderSync, FileSpreadsheet, Link2, Mail } from "lucide-react";
import { MotionScrollSection } from "@/components/MotionScrollSection";
import { QuickBooksUpsellModal } from "@/components/QuickBooksUpsellModal";

const INTEGRATIONS = [
  {
    name: "QuickBooks",
    icon: Plug,
    description:
      "Absolute Precision: sync any architectural asset—invoices, BOLs, contracts—directly to your books.",
    status: "active" as const,
    connectHref: "/api/quickbooks/auth",
    proOnly: true,
  },
  {
    name: "Zapier",
    icon: Zap,
    description: "Connect to 5,000+ apps automatically.",
    status: "coming_soon" as const,
    proOnly: false,
  },
  {
    name: "Google Drive",
    icon: FolderSync,
    description: "Import and export from Drive.",
    status: "coming_soon" as const,
    proOnly: false,
  },
  {
    name: "Excel Online",
    icon: FileSpreadsheet,
    description: "Open and edit spreadsheets in the cloud.",
    status: "coming_soon" as const,
    proOnly: false,
  },
];

function ReportingAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [clockVisible, setClockVisible] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => setClockVisible(true), 600);
    return () => clearTimeout(t);
  }, [isInView]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.07] border-t-teal-accent/30 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
    >
      <div className="py-8 px-4 sm:py-14 sm:px-10 text-center max-w-full box-border">
        <motion.p
          className="text-lg sm:text-2xl md:text-3xl font-extrabold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white break-words"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-[#22d3ee] drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            PRECISION REPORTING.
          </span>{" "}
          <span className="text-white">DELIVERED WEEKLY.</span>
        </motion.p>

        <motion.div
          className="mt-8 flex justify-center items-center gap-3"
          initial={{ opacity: 0, rotateX: -20 }}
          animate={isInView && clockVisible ? { opacity: 1, rotateX: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 400 }}
        >
          <motion.span
            className="font-mono text-3xl sm:text-4xl font-bold tabular-nums text-[#22d3ee] bg-slate-900/60 border border-[#22d3ee]/30 rounded-lg px-4 py-2 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView && clockVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            8:00 AM
          </motion.span>
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Monday</span>
        </motion.div>

        <motion.div
          className="mt-10 flex justify-center items-center gap-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 1.1 }}
        >
          <motion.div
            className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#22d3ee]/20 border border-[#22d3ee]/40 text-[#22d3ee]"
            initial={{ x: -80, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <FileSpreadsheet className="w-7 h-7" aria-hidden />
          </motion.div>
          <motion.span
            className="text-slate-500 font-mono text-sm"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
          >
            →
          </motion.span>
          <motion.div
            className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 border border-white/20 text-teal-accent"
            initial={{ x: 40, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Mail className="w-7 h-7" aria-hidden />
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-8 text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium break-words"
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Every Monday at 8:00 AM, VeloDoc delivers a comprehensive CSV architectural log of your nationwide sync history directly to your inbox.
        </motion.p>
      </div>
    </div>
  );
}

export function IntegrationsSection() {
  const [upsellOpen, setUpsellOpen] = useState(false);

  return (
    <>
      <MotionScrollSection id="integrations" className="mb-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Integrations
        </h2>
        <p className="text-slate-300 text-center text-sm max-w-xl mx-auto mb-8">
          VeloDoc fits into your ecosystem. QuickBooks is live; more integrations are on the way.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {INTEGRATIONS.map(({ name, icon: Icon, description, status, connectHref, proOnly }) => (
            <div
              key={name}
              className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 flex flex-col items-center text-center shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-teal-accent" />
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <h3 className="font-semibold text-white">{name}</h3>
                {proOnly && (
                  <span className="rounded-full bg-[#22d3ee]/20 border border-[#22d3ee]/40 px-2.5 py-0.5 text-[10px] font-medium text-[#22d3ee] uppercase tracking-wider">
                    Pro Feature
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-1">{description}</p>
              {status === "active" && connectHref ? (
                <>
                  <span className="mt-4 inline-block rounded-full bg-lime-500/20 border border-lime-400/40 px-3 py-1 text-xs font-medium text-lime-300">
                    Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setUpsellOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-accent hover:bg-teal-accent/90 text-petroleum px-4 py-2.5 text-sm font-semibold transition-colors"
                  >
                    <Link2 className="h-4 w-4" />
                    Connect
                  </button>
                </>
              ) : (
                <span className="mt-4 inline-block rounded-full bg-petroleum/80 border border-teal-accent/30 px-3 py-1 text-xs font-medium text-teal-accent">
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </div>
        {upsellOpen && (
          <QuickBooksUpsellModal onClose={() => setUpsellOpen(false)} />
        )}

        <div className="mt-12 max-w-2xl mx-auto w-full px-2 sm:px-0 overflow-hidden">
          <ReportingAnimation />
        </div>
      </MotionScrollSection>
    </>
  );
}
