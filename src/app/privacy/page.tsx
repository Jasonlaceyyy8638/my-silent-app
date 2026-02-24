"use client";

import Link from "next/link";
import { Download, Shield } from "lucide-react";

const LAST_UPDATED = "February 2025";

const TOC_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "data-we-collect", label: "Data We Collect" },
  { id: "how-we-use", label: "How We Use Data" },
  { id: "intuit-data", label: "Intuit / QuickBooks Data" },
  { id: "institutional-management", label: "Institutional Management" },
  { id: "retention-security", label: "Retention & Security" },
  { id: "contact", label: "Contact" },
] as const;

export default function PrivacyPolicyPage() {
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-teal-950/20 print:bg-white">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <aside className="lg:w-56 shrink-0 print:hidden">
            <nav className="lg:sticky lg:top-24 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">
                Contents
              </p>
              {TOC_ITEMS.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-[#22d3ee] hover:bg-white/5 transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="flex-1 min-w-0">
            <div className="rounded-2xl border border-[#22d3ee]/20 bg-white/[0.07] backdrop-blur-xl shadow-[0_8px_32px_rgba(34,211,238,0.08)] border-t-[#22d3ee]/30 p-8 sm:p-10 print:bg-white print:border print:border-slate-200 print:shadow-none">
              <header className="border-b border-white/10 pb-6 mb-8 print:border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white print:text-slate-900 tracking-tight">
                    Privacy Policy
                  </h1>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#22d3ee]/50 bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 text-[#22d3ee] px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 print:hidden"
                  >
                    <Download className="w-4 h-4" aria-hidden />
                    Download PDF
                  </button>
                </div>
                <p className="text-slate-400 text-sm font-mono print:text-slate-600">
                  Last updated: {LAST_UPDATED}
                </p>
              </header>

              <div className="space-y-10">
                <section id="overview" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#22d3ee] shrink-0" aria-hidden />
                    1. Overview
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    VeloDoc (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our document extraction and QuickBooks integration services. We do not sell your data. We do not share your data with third parties for marketing or advertising purposes.
                  </p>
                </section>

                <section id="data-we-collect" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#22d3ee] shrink-0" aria-hidden />
                    2. Data We Collect
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    We collect only what is necessary to provide and improve the Service:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc pl-6 print:text-slate-700">
                    <li><strong className="text-white/90 print:text-slate-900">Account data:</strong> email, name, and organization membership (via Clerk).</li>
                    <li><strong className="text-white/90 print:text-slate-900">Document data:</strong> files you upload, extracted structured data (e.g. vendor, total, date), and sync status for QuickBooks.</li>
                    <li><strong className="text-white/90 print:text-slate-900">Usage data:</strong> credit consumption, API logs for security and troubleshooting, and sync history for institutional reporting.</li>
                  </ul>
                </section>

                <section id="how-we-use" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#22d3ee] shrink-0" aria-hidden />
                    3. How We Use Data
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    We use your data solely to operate the Service: to authenticate you, run AI extraction on your documents, store results, sync to QuickBooks when you request it, manage credits and roles, and send transactional or security-related communications. We do not use your documents or extracted data for advertising, profiling, or sharing with third parties.
                  </p>
                </section>

                <section id="intuit-data" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#22d3ee] shrink-0" aria-hidden />
                    4. Intuit / QuickBooks Data
                  </h2>
                  <div className="rounded-xl border border-[#22d3ee]/25 bg-[#22d3ee]/5 p-4 mb-4 print:border-slate-300 print:bg-slate-50">
                    <p className="text-slate-200 text-sm font-medium mb-2 print:text-slate-800">
                      Intuit Data Protection
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed mb-2 print:text-slate-700">
                      When you connect QuickBooks or sync documents to Intuit&apos;s services, we store only the tokens and identifiers necessary to perform the sync (e.g. access token, refresh token, company/realm id). We do <strong className="text-white/90 print:text-slate-900">not</strong> share your Intuit data, your extracted document data, or any personally identifiable information with third parties. Data sent to Intuit is limited to what you explicitly authorize (e.g. creating a Bill in your QuickBooks company). We do not use Intuit data for any purpose other than fulfilling the sync and related support you request.
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                      We do not sell, rent, or disclose your data to third parties for their marketing or analytics. Our processing of Intuit-related data is consistent with our Data Processing Agreement and applicable data protection requirements.
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed mt-2 print:text-slate-700">
                      For QuickBooks or Intuit app support inquiries, contact VeloDoc Support at support@velodoc.app.
                    </p>
                  </div>
                </section>

                <section id="institutional-management" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#22d3ee] shrink-0" aria-hidden />
                    5. Institutional Management
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    For organizations, we provide role-based access and data permissions so you can maintain institutional control over who sees and acts on your data:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc pl-6 print:text-slate-700">
                    <li><strong className="text-white/90 print:text-slate-900">Admins</strong> have full access to credits, team management, all documents in the organization, sync history, API logs, and export capabilities.</li>
                    <li><strong className="text-white/90 print:text-slate-900">Editors</strong> can upload, edit, and delete their own files; they can edit all organization documents but may only delete documents they personally uploaded. They can trigger QuickBooks sync for documents they are permitted to edit.</li>
                    <li><strong className="text-white/90 print:text-slate-900">Viewers</strong> have read-only access to processed data; they cannot edit, delete, or sync documents.</li>
                  </ul>
                  <p className="text-slate-300 text-sm leading-relaxed mt-4 print:text-slate-700">
                    Data visibility and export (e.g. CSV of sync history) are restricted by role so that only authorized users can access or export organizational data. This institutional management model helps you meet compliance and internal governance requirements.
                  </p>
                </section>

                <section id="retention-security" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#22d3ee] shrink-0" aria-hidden />
                    6. Retention & Security
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    We retain your account and document data for as long as your account is active or as needed to provide the Service and comply with legal obligations. We use industry-standard security measures (encryption in transit and at rest, access controls, secure authentication) to protect your data. Details are in our{" "}
                    <Link href="/security" className="text-[#22d3ee] hover:underline print:text-slate-900 print:no-underline">
                      Security & Trust
                    </Link>{" "}
                    and{" "}
                    <Link href="/dpa" className="text-[#22d3ee] hover:underline print:text-slate-900 print:no-underline">
                      Data Processing Agreement
                    </Link>.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#22d3ee] shrink-0" aria-hidden />
                    7. Contact
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    For privacy questions or requests (access, correction, deletion), contact VeloDoc Support at support@velodoc.app. We will respond in accordance with applicable law.
                  </p>
                </section>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
