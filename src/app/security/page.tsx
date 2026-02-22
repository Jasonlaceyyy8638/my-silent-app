"use client";

import { Mail } from "lucide-react";

const SUPPORT_EMAIL = "support@velodoc.app";

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

function CloudIcon({ className }: { className?: string }) {
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
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

const PILLARS = [
  {
    id: "encryption",
    Icon: LockIcon,
    title: "Data Encryption",
    description:
      "All data is encrypted at rest using AES-256 and in transit via TLS 1.2+. Institutional-grade protection ensures your documents and extracted data remain confidential from upload through storage and retrieval.",
  },
  {
    id: "infrastructure",
    Icon: CloudIcon,
    title: "Cloud Infrastructure",
    description:
      "VeloDoc is hosted on enterprise-grade AWS and Google Cloud infrastructure with 99.9% uptime SLA and redundant backups. Our compliance-first architecture is designed for reliability and disaster recovery.",
  },
  {
    id: "privacy",
    Icon: ShieldIcon,
    title: "Privacy First",
    description:
      "We do not sell your data. Your uploaded documents are processed and stored securely in private Supabase buckets. Data is isolated per tenant and never used for training or marketing.",
  },
  {
    id: "access",
    Icon: AwardIcon,
    title: "Access Control",
    description:
      "We use Clerk for multi-factor authentication (MFA) so only authorized users access their documents. Role-based access and audit trails give you full control over who sees what.",
  },
] as const;

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Security & Trust
          </h1>
          <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Institutional-grade protection and a compliance-first architecture. Your data is encrypted, isolated, and under your control.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {PILLARS.map(({ id, Icon, title, description }) => (
            <article
              key={id}
              className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30"
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-teal-accent/10 flex items-center justify-center shrink-0 text-teal-accent">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {title}
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30">
          <p className="text-slate-300 text-sm text-center max-w-md">
            Questions about our security practices or compliance posture? Our security team is ready to help.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-6 py-3 text-sm font-semibold transition-colors"
          >
            <Mail className="w-5 h-5" aria-hidden />
            Contact Security Team
          </a>
        </div>
      </div>
    </main>
  );
}
