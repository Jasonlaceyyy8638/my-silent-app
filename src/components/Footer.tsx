"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

const TRUST_SIGNALS = [
  { label: "Enterprise Grade Security" },
  { label: "256-bit Encryption" },
  { label: "Trusted by Pros Worldwide" },
] as const;

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AwardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

const SECURITY_ITEMS = [
  { Icon: ShieldIcon, label: "Enterprise Security", detail: "Enterprise-grade protection" },
  { Icon: LockIcon, label: "256-bit Encryption", detail: "At rest & in transit" },
  { Icon: AwardIcon, label: "SOC 2 / GDPR", detail: "Compliance ready" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-petroleum/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div id="trust-center" className="scroll-mt-24">
          <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 text-center mb-6">
            Security & Compliance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            {SECURITY_ITEMS.map(({ Icon, label, detail }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-5 border-t-teal-accent/20"
              >
                <Icon className="h-6 w-6 text-teal-accent/90 shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-center">
                  {label}
                </span>
                <span className="text-[10px] font-mono text-slate-500 text-center">
                  {detail}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 border-t border-white/10 pt-8">
          {TRUST_SIGNALS.map(({ label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase tracking-wider"
            >
              <Globe className="h-4 w-4 text-teal-accent/70 flex-shrink-0" aria-hidden />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <Link
            href="/security"
            className="text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-teal-accent transition-colors"
          >
            Security & Trust
          </Link>
          <p className="text-slate-500 text-[10px] font-mono">
            © {new Date().getFullYear()} VeloDoc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
