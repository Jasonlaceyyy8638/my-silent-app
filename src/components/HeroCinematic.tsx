"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

const WINDOWS_DOWNLOAD_URL = "/downloads/VeloDoc-Setup.exe";
const MAC_DOWNLOAD_URL = "/downloads/VeloDoc-Setup.dmg";

export function HeroCinematic() {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setDownloadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-start overflow-hidden px-6 pt-6 sm:pt-8 pb-12 sm:pb-16">
      {/* Subtle looping background: gradient + animated lines */}
      <div className="absolute inset-0 bg-gradient-to-br from-petroleum via-slate-900 to-teal-950/40" aria-hidden />
      <div className="absolute inset-0 hero-particles" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]" aria-hidden />

      <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-start w-full pt-4">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center justify-center"
        >
          <Image
            src="/logo-png.png"
            alt="VeloDoc"
            width={672}
            height={269}
            className="w-[476px] sm:w-[560px] lg:w-[644px] h-auto object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.3)]"
          />
        </motion.div>

        <motion.div
          ref={downloadRef}
          className="hidden md:flex flex-col items-center justify-center mt-4 mb-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setDownloadOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#22d3ee] bg-[#22d3ee]/10 px-6 py-3.5 text-base font-bold text-[#22d3ee] shadow-[0_0_24px_rgba(34,211,238,0.4)] hover:bg-[#22d3ee]/20 hover:shadow-[0_0_32px_rgba(34,211,238,0.5)] transition-all"
              aria-expanded={downloadOpen}
              aria-haspopup="true"
              aria-label="Download Desktop Architect — choose OS"
            >
              Download Desktop Architect
              <ChevronDown className={`w-5 h-5 transition-transform ${downloadOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {downloadOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] rounded-xl border border-[#22d3ee]/40 bg-[#0b172a]/98 backdrop-blur-xl shadow-xl py-2 border-t-[#22d3ee]/60 z-20"
                role="menu"
              >
                <a
                  href={WINDOWS_DOWNLOAD_URL}
                  download="VeloDoc-Setup.exe"
                  role="menuitem"
                  className="block px-4 py-3 text-sm font-medium text-slate-200 hover:text-[#22d3ee] hover:bg-[#22d3ee]/10 transition-colors"
                  onClick={() => setDownloadOpen(false)}
                >
                  Download for Windows
                </a>
                <a
                  href={MAC_DOWNLOAD_URL}
                  download="VeloDoc-Setup.dmg"
                  role="menuitem"
                  className="block px-4 py-3 text-sm font-medium text-slate-200 hover:text-[#22d3ee] hover:bg-[#22d3ee]/10 transition-colors"
                  onClick={() => setDownloadOpen(false)}
                >
                  Download for Mac
                </a>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="mt-4 mb-2 min-h-[1.75rem] flex items-center justify-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SignedOut>
            <p className="text-base sm:text-lg font-semibold text-teal-accent">
              Start Architecting for Free — Get 5 Credits on Signup
            </p>
          </SignedOut>
          <SignedIn>
            <p className="text-sm font-medium text-slate-400">Welcome back</p>
          </SignedIn>
        </motion.div>

        <motion.h1
          className="mt-4 text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter text-white leading-[1.05]"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          The Universal AI Engine for Messy Data
        </motion.h1>

        <motion.p
          className="mt-5 text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          Architect your documents—BOLs, contracts, forms, and any paper-to-digital workflow—into structured, queryable data with one-click export.
        </motion.p>

        <motion.div
          className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <span className="rounded-full border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-3 py-1 text-[#22d3ee] font-medium">BOLs</span>
          <span className="rounded-full border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-3 py-1 text-[#22d3ee] font-medium">Contracts</span>
          <span className="rounded-full border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-3 py-1 text-[#22d3ee] font-medium">Forms</span>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-accent hover:bg-lime-accent text-petroleum px-8 py-4 text-base font-semibold transition-colors shadow-[0_0_25px_rgba(34,211,238,0.3)]"
            >
              Go to Dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-accent hover:bg-lime-accent text-petroleum px-8 py-4 text-base font-bold transition-colors shadow-[0_0_25px_rgba(34,211,238,0.3)]"
            >
              Create Free Account
            </Link>
            <p className="text-slate-400 text-sm text-center max-w-md">
              No credit card required. Enterprise-grade extraction with nationwide compliance.
            </p>
          </SignedOut>
        </motion.div>
      </div>
    </section>
  );
}
