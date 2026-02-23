"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export function HeroCinematic() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* Subtle looping background: gradient + animated lines */}
      <div className="absolute inset-0 bg-gradient-to-br from-petroleum via-slate-900 to-teal-950/40" aria-hidden />
      <div className="absolute inset-0 hero-particles" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]" aria-hidden />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Image
            src="/logo-png.png"
            alt="VeloDoc"
            width={480}
            height={192}
            className="w-[340px] sm:w-[400px] lg:w-[460px] h-auto drop-shadow-[0_0_25px_rgba(34,211,238,0.3)] mx-auto"
          />
        </motion.div>

        <motion.p
          className="mb-4 text-base sm:text-lg font-semibold text-teal-accent"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Start Architecting for Free — Get 5 Credits on Signup
        </motion.p>

        <motion.h1
          className="text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tighter text-white leading-[1.05]"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Architect Your Data
        </motion.h1>

        <motion.p
          className="mt-8 text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          VeloDoc is the enterprise AI that turns unstructured PDFs into structured, queryable data—invoices, BOLs, contracts, and transcripts—with one-click export.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center gap-3"
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
              No credit card required. Experience institutional-grade extraction in seconds.
            </p>
          </SignedOut>
        </motion.div>
      </div>
    </section>
  );
}
