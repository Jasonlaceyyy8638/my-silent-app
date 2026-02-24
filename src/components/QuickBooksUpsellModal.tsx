"use client";

import Link from "next/link";
import { X, Zap, FileSpreadsheet } from "lucide-react";

type QuickBooksUpsellModalProps = {
  onClose: () => void;
};

export function QuickBooksUpsellModal({ onClose }: QuickBooksUpsellModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-modal-title"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-[#22d3ee]/30 bg-[#0f172a]/95 backdrop-blur-xl p-6 w-full max-w-md shadow-[0_0_32px_rgba(34,211,238,0.2)] border-t-[#22d3ee]/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="upsell-modal-title" className="text-lg font-semibold text-[#22d3ee]">
            Unlock the QuickBooks bridge
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-slate-300 text-sm mb-5">
          Integrations are a <strong className="text-white">Pro</strong> feature. Upgrade to connect QuickBooks and get the full automated bridge plus weekly reporting.
        </p>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3 text-sm text-slate-300">
            <span className="w-8 h-8 rounded-lg bg-[#22d3ee]/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-[#22d3ee]" />
            </span>
            <span><strong className="text-white">Active QuickBooks bridge</strong> — push invoices, BOLs, and contracts directly to your books with one click.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-slate-300">
            <span className="w-8 h-8 rounded-lg bg-[#22d3ee]/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-[#22d3ee]" />
            </span>
            <span><strong className="text-white">Weekly CSV report</strong> — every Monday at 8:00 AM, get a comprehensive architectural log of your nationwide sync history in your inbox.</span>
          </li>
        </ul>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/#pricing"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-[#0f172a] px-4 py-3 text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Upgrade to Pro
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
