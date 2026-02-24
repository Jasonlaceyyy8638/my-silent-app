"use client";

import Link from "next/link";
import { Download, Globe } from "lucide-react";

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

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-petroleum/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 sm:gap-6 flex-wrap">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {SECURITY_BADGES.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 border-t-teal-accent/20"
              >
                <Icon className="h-5 w-5 text-teal-accent/90 shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <nav
            className="flex flex-wrap items-center gap-4 sm:gap-6 border-t border-white/10 pt-6 sm:pt-0 sm:border-t-0"
            aria-label="Trust and legal"
          >
            <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-widest text-slate-500 mr-1">
              Trust &amp; legal
            </span>
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
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 border-t border-white/10 pt-8 mt-8">
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
        <div className="border-t border-white/10 pt-8 mt-8">
          <p className="text-center text-slate-400 text-xs font-medium mb-4 uppercase tracking-wider">
            Contact
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8">
            <Link
              href="/download"
              className="hidden md:inline-flex items-center gap-2 text-[#22d3ee] font-medium text-sm py-3 px-4 rounded-xl min-h-[44px] border border-[#22d3ee]/50 hover:bg-[#22d3ee]/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-colors"
              title="Download Desktop App"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden />
              Download Desktop App
            </Link>
            <span
              className="md:hidden inline-flex items-center gap-2 text-slate-500 text-sm py-3 px-4 rounded-xl border border-white/15"
              title="Coming soon"
            >
              Get Mobile App <span className="text-[10px]">(Coming Soon)</span>
            </span>
            <a
              href="mailto:sales@velodoc.app"
              className="text-teal-accent hover:text-[#7dd3fc] font-medium text-sm py-3 px-4 rounded-xl min-h-[44px] min-w-[44px] inline-flex items-center justify-center touch-manipulation transition-colors border border-teal-accent/30 hover:border-teal-accent/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Interested in bulk credits? Contact sales@velodoc.app
            </a>
            <a
              href="mailto:support@velodoc.app"
              className="text-teal-accent hover:text-[#7dd3fc] font-medium text-sm py-3 px-4 rounded-xl min-h-[44px] min-w-[44px] inline-flex items-center justify-center touch-manipulation transition-colors border border-teal-accent/30 hover:border-teal-accent/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              style={{ WebkitTapHighlightColor: "transparent" }}
              title="Support — support@velodoc.app"
            >
              Need technical help? Reach out to support@velodoc.app
            </a>
            <a
              href="mailto:billing@velodoc.app"
              className="text-teal-accent hover:text-[#7dd3fc] font-medium text-sm py-3 px-4 rounded-xl min-h-[44px] min-w-[44px] inline-flex items-center justify-center touch-manipulation transition-colors border border-teal-accent/30 hover:border-teal-accent/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              style={{ WebkitTapHighlightColor: "transparent" }}
              title="Billing — billing@velodoc.app"
            >
              Billing inquiry? Contact billing@velodoc.app
            </a>
          </div>
        </div>
        <p className="mt-6 text-center text-slate-500 text-[10px] font-mono">
          © {new Date().getFullYear()} VeloDoc. All rights reserved.
        </p>
        <p className="mt-3 text-center">
          <a
            href="mailto:support@velodoc.app?subject=Credits%20or%20support"
            className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-teal-accent transition-colors"
            title="VeloDoc Support — support@velodoc.app"
          >
            Credits &amp; support: VeloDoc Support — support@velodoc.app
          </a>
        </p>
      </div>
    </footer>
  );
}
