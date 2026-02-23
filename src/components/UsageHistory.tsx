"use client";

import { FileText, Calendar, Zap } from "lucide-react";
import Link from "next/link";

export type UsageEntry = {
  file_name: string;
  date_processed: string;
  credits_used: number;
};

type UsageHistoryProps = {
  usage: UsageEntry[];
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function UsageHistory({ usage }: UsageHistoryProps) {
  if (usage.length === 0) {
    return (
      <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 p-6 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-accent" aria-hidden />
          Usage History
        </h2>
        <p className="text-slate-400 text-sm">
          Your processed documents will appear here. Upload a PDF to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 overflow-hidden shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
      <div className="p-6 sm:p-8 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-accent" aria-hidden />
          Usage History
        </h2>
        <p className="text-slate-400 text-xs mt-1">Recent extractions from Supabase</p>
      </div>
      <div className="divide-y divide-white/10 max-h-[320px] overflow-y-auto">
        {usage.slice(0, 20).map((entry, i) => (
          <div
            key={`${entry.file_name}-${entry.date_processed}-${i}`}
            className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-teal-accent/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-teal-accent" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate" title={entry.file_name}>
                  {entry.file_name}
                </p>
                <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" aria-hidden />
                  {formatDate(entry.date_processed)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-teal-accent font-semibold tabular-nums text-sm">
                {entry.credits_used} {entry.credits_used === 1 ? "credit" : "credits"}
              </span>
            </div>
          </div>
        ))}
      </div>
      {usage.length > 20 && (
        <p className="p-3 text-center text-slate-500 text-xs border-t border-white/10">
          Showing latest 20 of {usage.length}
        </p>
      )}
    </section>
  );
}
