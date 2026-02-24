"use client";

import Link from "next/link";
import { Download, FileText } from "lucide-react";

const LAST_UPDATED = "February 2025";

const TOC_ITEMS = [
  { id: "definitions", label: "Definitions" },
  { id: "scope", label: "Scope of Processing" },
  { id: "toms", label: "Technical & Organizational Measures" },
  { id: "rights", label: "Data Subject Rights" },
  { id: "subprocessors", label: "Sub-processors" },
] as const;

export default function DPAPage() {
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum print:bg-white">
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
                    Data Processing Agreement
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

              <div className="prose prose-invert prose-slate max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-headings:text-white prose-li:text-slate-300 print:prose-slate print:prose-p:text-slate-700 print:prose-headings:text-slate-900 print:prose-li:text-slate-700">
                <section id="definitions" className="scroll-mt-28 mb-10">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    1. Definitions
                  </h2>
                  <ul className="space-y-3 text-sm list-none pl-0">
                    <li>
                      <strong className="text-teal-accent/90 print:text-slate-900">Data Controller</strong> means the customer (you) who determines the purposes and means of the processing of personal data. As the user of VeloDoc, you are the Data Controller in respect of any personal data you upload or direct us to process.
                    </li>
                    <li>
                      <strong className="text-teal-accent/90 print:text-slate-900">Data Processor</strong> means VeloDoc, which processes personal data on behalf of and solely in accordance with the instructions of the Data Controller. We act only as a processor in relation to your data.
                    </li>
                  </ul>
                </section>

                <section id="scope" className="scroll-mt-28 mb-10">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    2. Scope of Processing
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">
                    VeloDoc processes uploaded documents solely to extract structured data as directed by the user. We do not use your documents for any purpose other than providing the extraction and related services you request. Processing is limited to the duration and scope necessary to deliver those services.
                  </p>
                </section>

                <section id="toms" className="scroll-mt-28 mb-10">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    3. Technical & Organizational Measures (TOMs)
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    We implement technical and organizational measures appropriate to the risk, in line with our security and compliance commitments. For full details, see our{" "}
                    <Link href="/security" className="text-teal-accent hover:underline print:text-slate-900 print:no-underline">
                      Security & Trust
                    </Link>{" "}
                    page. Key measures include:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc pl-6 print:text-slate-700">
                    <li><strong className="text-white/90 print:text-slate-900">Encryption at rest:</strong> AES-256 for stored data.</li>
                    <li><strong className="text-white/90 print:text-slate-900">Encryption in transit:</strong> TLS 1.2+ for all data in transit.</li>
                    <li><strong className="text-white/90 print:text-slate-900">Access control:</strong> Multi-factor authentication (MFA) via Clerk to ensure only authorized users access their documents.</li>
                  </ul>
                </section>

                <section id="rights" className="scroll-mt-28 mb-10">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    4. Data Subject Rights
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    Data subjects whose data we process on your behalf may exercise their rights (access, rectification, erasure, restriction, portability, objection) through you as the Data Controller. To support your compliance:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc pl-6 print:text-slate-700">
                    <li><strong className="text-white/90 print:text-slate-900">Access & export:</strong> Users can access and export their extracted data from the VeloDoc dashboard and via downloadable exports (e.g. CSV, Excel).</li>
                    <li><strong className="text-white/90 print:text-slate-900">Deletion:</strong> You may request deletion of your data held in our Supabase storage and related systems by contacting the Operations Team at support@velodoc.app. We will process such requests in accordance with our data retention and deletion procedures.</li>
                  </ul>
                </section>

                <section id="subprocessors" className="scroll-mt-28 mb-8">
                  <h2 className="text-lg font-semibold text-white print:text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-accent shrink-0" aria-hidden />
                    5. Sub-processors
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 print:text-slate-700">
                    We use the following categories of sub-processors to operate VeloDoc. Each is selected with regard to security, compliance, and contractual commitments:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc pl-6 print:text-slate-700">
                    <li><strong className="text-white/90 print:text-slate-900">Hosting:</strong> AWS and Google Cloud (infrastructure and application hosting).</li>
                    <li><strong className="text-white/90 print:text-slate-900">Database & storage:</strong> Supabase (database and object storage for your documents and extracted data).</li>
                    <li><strong className="text-white/90 print:text-slate-900">AI / extraction:</strong> OpenAI (powering the AI Architect for document extraction).</li>
                    <li><strong className="text-white/90 print:text-slate-900">Authentication:</strong> Clerk (user authentication and MFA).</li>
                  </ul>
                </section>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
