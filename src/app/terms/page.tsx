"use client";

import Link from "next/link";
import { Download, FileText } from "lucide-react";

const LAST_UPDATED = "February 2025";

const TOC_ITEMS = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "credit-usage", label: "Credit Usage Policy" },
  { id: "fair-use", label: "Enterprise Fair Use" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "intuit-data", label: "Intuit / QuickBooks Data" },
  { id: "institutional-management", label: "Institutional Management" },
  { id: "limit-of-liability", label: "Liability & Accuracy" },
  { id: "general", label: "General" },
] as const;

export default function TermsPage() {
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
                  className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-teal-accent hover:bg-white/5 transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="flex-1 min-w-0">
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30 p-8 sm:p-10 print:bg-white print:border print:border-slate-200 print:shadow-none">
              <header className="border-b border-white/10 pb-6 mb-8 print:border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white print:text-slate-900 tracking-tight">
                    Terms of Service & Usage Policy
                  </h1>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 print:hidden"
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
                <section id="acceptance" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    By accessing or using VeloDoc (&quot;Service&quot;), you agree to be bound by these Terms of Service and our{" "}
                    <Link href="/dpa" className="text-teal-accent hover:underline print:text-slate-900 print:no-underline">
                      Data Processing Agreement
                    </Link>
                    . If you do not agree, do not use the Service.
                  </p>
                </section>

                <section id="credit-usage" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    2. Credit Usage Policy
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    One (1) credit allows for the architecture of one (1) document up to five (5) pages. Documents exceeding this limit will consume one (1) additional credit per five (5)-page block (e.g., 6–10 pages = 2 credits; 11–15 pages = 3 credits).
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    Credits are deducted upon successful data extraction. Credits are <strong className="text-white/90 print:text-slate-900">non-refundable</strong> once the Architect has processed the file, regardless of the outcome or your satisfaction with the result.
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    Unused credits do not expire for the duration of your account. Purchase terms and pricing are displayed at the point of purchase and may be updated from time to time.
                  </p>
                </section>

                <section id="fair-use" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    3. Enterprise Fair Use
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    VeloDoc reserves the right to rate-limit accounts that exhibit unusual or automated, bot-like behavior. This ensures institutional-grade performance and fairness for all users. We may temporarily or permanently restrict access for accounts that abuse the Service or negatively impact system stability.
                  </p>
                </section>

                <section id="acceptable-use" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    4. Acceptable Use
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not use the Service to process documents or data in any way that:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc pl-6 print:text-slate-700">
                    <li>Violates any applicable law, regulation, or third-party rights.</li>
                    <li>Involves illegal document processing, fraud, or the facilitation of illegal activity.</li>
                    <li>Infringes intellectual property or privacy rights of others.</li>
                    <li>Attempts to reverse-engineer, disrupt, or compromise the security or availability of the Service.</li>
                  </ul>
                  <p className="text-slate-300 text-sm leading-relaxed mt-4 print:text-slate-700">
                    We reserve the right to suspend or terminate access for violations of this Acceptable Use policy.
                  </p>
                </section>

                <section id="intuit-data" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    5. Intuit / QuickBooks Data
                  </h2>
                  <div className="rounded-xl border border-teal-accent/20 bg-teal-accent/5 p-4 mb-4 print:border-slate-300 print:bg-slate-50">
                    <p className="text-slate-200 text-sm font-medium mb-1 print:text-slate-800">
                      No Third-Party Sharing
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                      We do not share your data with third parties. When you use QuickBooks integration, we store only the tokens and identifiers required to perform the sync. We do not sell, rent, or disclose your Intuit data, extracted document data, or personally identifiable information to third parties for marketing, advertising, or any other purpose. Data sent to Intuit is limited to what you explicitly authorize (e.g. creating a Bill in your QuickBooks company).
                    </p>
                  </div>
                </section>

                <section id="institutional-management" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    6. Institutional Management
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    For organizations, we provide role-based access and data permissions to support institutional control over financial and document data:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc pl-6 print:text-slate-700">
                    <li><strong className="text-white/90 print:text-slate-900">Admins</strong> have full access to credits, team management, all organization documents, sync history, API logs, and exports.</li>
                    <li><strong className="text-white/90 print:text-slate-900">Editors</strong> can upload, edit all org documents, and delete only their own uploads; they can trigger QuickBooks sync for documents they are permitted to edit.</li>
                    <li><strong className="text-white/90 print:text-slate-900">Viewers</strong> have read-only access; they cannot edit, delete, or sync.</li>
                  </ul>
                  <p className="text-slate-300 text-sm leading-relaxed mt-4 print:text-slate-700">
                    Data visibility and export are restricted by role so that only authorized users access or export organizational data, in line with institutional management and compliance expectations.
                  </p>
                </section>

                <section id="limit-of-liability" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    7. Liability &amp; Accuracy
                  </h2>
                  <div className="rounded-xl border border-teal-accent/20 bg-teal-accent/5 p-4 mb-4 print:border-slate-300 print:bg-slate-50">
                    <p className="text-slate-200 text-sm font-medium mb-1 print:text-slate-800">
                      Professional Disclaimer
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                      VeloDoc utilizes advanced AI for data extraction. While highly accurate, users are responsible for final verification of data before importing into financial systems such as QuickBooks or other accounting or ERP systems.
                    </p>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    The Service is an AI-based document extraction tool. Extraction results are provided &quot;as is&quot; and we do not guarantee that outputs are complete, error-free, or fit for any particular purpose. You are responsible for verifying and using extracted data appropriately.
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    To the maximum extent permitted by law, VeloDoc and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or business opportunity, arising out of or in connection with your use of the Service. Our total liability for any claims arising from these Terms or the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
                  </p>
                </section>

                <section id="general" className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    8. General
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance. For questions, contact us at support@velodoc.app. Our{" "}
                    <Link href="/security" className="text-teal-accent hover:underline print:text-slate-900 print:no-underline">
                      Security & Trust
                    </Link>{" "}
                    and{" "}
                    <Link href="/dpa" className="text-teal-accent hover:underline print:text-slate-900 print:no-underline">
                      Data Processing Agreement
                    </Link>{" "}
                    form part of our commitment to enterprise-grade compliance.
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
