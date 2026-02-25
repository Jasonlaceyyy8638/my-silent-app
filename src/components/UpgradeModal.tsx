"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";

type UpgradeModalProps = {
  onClose: () => void;
};

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data?.error ?? "Checkout failed");
    } catch (err) {
      console.error("Upgrade checkout failed", err);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-[#22d3ee]/30 bg-[#0f172a]/98 backdrop-blur-xl w-full max-w-md shadow-[0_0_32px_rgba(34,211,238,0.2)] border-t-[#22d3ee]/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2 id="upgrade-modal-title" className="text-xl font-bold text-white leading-tight">
              Unlock More Architectural Precision
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            You&apos;ve used your monthly allowance. Upgrade to the <strong className="text-white">Professional</strong> tier to get <strong className="text-[#22d3ee]">150 Architectural Credits</strong> and <strong className="text-white">Automated Monday 8 AM Reports</strong> immediately.
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 p-4 mb-6">
            <span className="w-10 h-10 rounded-xl bg-[#22d3ee]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#22d3ee]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">Professional — $79/mo</p>
              <p className="text-slate-400 text-xs mt-0.5">150 credits · QuickBooks bridge · Weekly CSV report</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-[#0f172a] px-5 py-3.5 text-sm font-bold transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? "Redirecting…" : "Upgrade to Professional — $79/mo"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
