"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export function SignupSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <div className={`${CARD_CLASS} p-8 sm:p-12 text-center max-w-2xl mx-auto`}>
      <div className="w-14 h-14 rounded-xl bg-teal-accent/20 flex items-center justify-center mx-auto mb-6 text-teal-accent">
        <Sparkles className="w-7 h-7" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        Start Architecting in Seconds
      </h2>
      <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-lg mx-auto">
        No credit card required. Experience institutional-grade extraction with 5 free credits on signup.
      </p>
      <SignedIn>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-teal-accent hover:bg-lime-accent text-petroleum px-8 py-4 text-base font-semibold transition-colors"
        >
          Go to Dashboard
        </Link>
      </SignedIn>
      <SignedOut>
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center rounded-xl bg-teal-accent hover:bg-lime-accent text-petroleum px-10 py-4 text-lg font-bold transition-colors shadow-[0_0_30px_rgba(34,211,238,0.4)] border-2 border-teal-accent"
        >
          Create Free Account
        </Link>
        <p className="mt-4 text-slate-400 text-sm">
          No credit card required. Experience institutional-grade extraction in seconds.
        </p>
      </SignedOut>
    </div>
  );

  if (!mounted) {
    return <section className="mb-14">{content}</section>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px 0px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14"
    >
      {content}
    </motion.section>
  );
}
