"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

const TRUST_SIGNALS = [
  { label: "Enterprise-Grade Security" },
  { label: "Nationwide Compliance" },
  { label: "Universal Data Engine" },
] as const;

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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

const SECURITY_BADGES = [
  { Icon: ShieldIcon, label: "Enterprise Security" },
  { Icon: LockIcon, label: "256-bit Encryption" },
  { Icon: AwardIcon, label: "SOC 2 / GDPR" },
] as const;

const TRUST_LEGAL_LINKS = [
  { href: "/security", label: "Security & Trust" },
  { href: "/dpa", label: "Data Processing Agreement" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

const CONTACT_LINKS = [
  { href: "mailto:sales@velodoc.app", label: "Sales", title: "sales@velodoc.app" },
  { href: "mailto:support@velodoc.app", label: "Support", title: "support@velodoc.app" },
  { href: "mailto:billing@velodoc.app", label: "Billing", title: "billing@velodoc.app" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-petroleum/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12 flex flex-col items-center text-center space-y-8 sm:space-y-10">
        {/* Security badges — scannable on small screens */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-6">
          {SECURITY_BADGES.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-slate-400 min-w-0"
            >
              <Icon className="h-4 w-4 text-teal-accent/80 shrink-0" aria-hidden />
              <span className="text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Legal links — centered */}
        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-6"
          aria-label="Trust and legal"
        >
          {TRUST_LEGAL_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-teal-accent transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Nationwide branding — Enterprise-Grade Security, Nationwide Compliance */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8">
          {TRUST_SIGNALS.map(({ label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
            >
              <Globe className="h-3.5 w-3.5 text-teal-accent/60 shrink-0" aria-hidden />
              {label}
            </span>
          ))}
        </div>

        {/* Contact — centered text links */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-6">
          {CONTACT_LINKS.map(({ href, label, title }) => (
            <a
              key={href}
              href={href}
              title={title}
              className="text-sm text-slate-300 hover:text-teal-accent transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <p className="text-slate-500 text-[10px] font-mono">
          © {new Date().getFullYear()} VeloDoc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
