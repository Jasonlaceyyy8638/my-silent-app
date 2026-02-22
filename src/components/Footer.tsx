"use client";

import { Shield, Lock, Globe } from "lucide-react";

const TRUST_SIGNALS = [
  { icon: Shield, label: "Enterprise Grade Security" },
  { icon: Lock, label: "256-bit Encryption" },
  { icon: Globe, label: "Trusted by Pros Worldwide" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-petroleum/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-slate-300 text-sm"
            >
              <Icon className="h-5 w-5 text-teal-accent/80 flex-shrink-0" aria-hidden />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-slate-500 text-xs">
          © {new Date().getFullYear()} VeloDoc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
