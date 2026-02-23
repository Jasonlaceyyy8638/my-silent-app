"use client";

import { Shield, Activity, Calendar, Zap } from "lucide-react";
import Link from "next/link";

export type SecurityLogEntry = {
  id?: string;
  endpoint: string;
  status_code: number;
  credits_consumed: number;
  created_at: string;
};

type SecurityLogProps = {
  logs: SecurityLogEntry[];
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

function statusLabel(code: number): string {
  if (code >= 200 && code < 300) return "Success";
  if (code === 402) return "Insufficient credits";
  if (code >= 400 && code < 500) return "Client error";
  if (code >= 500) return "Server error";
  return `HTTP ${code}`;
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "text-teal-accent";
  if (code === 402) return "text-amber-400";
  if (code >= 400 && code < 500) return "text-amber-400";
  if (code >= 500) return "text-red-400";
  return "text-slate-400";
}

export function SecurityLog({ logs }: SecurityLogProps) {
  if (logs.length === 0) {
    return (
      <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 p-6 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-accent" aria-hidden />
          Security Log
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Your API interaction history will appear here after you use the Architect.
        </p>
        <Link
          href="/security"
          className="text-teal-accent hover:underline text-sm font-medium"
        >
          View Security & Trust →
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 overflow-hidden shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
      <div className="p-6 sm:p-8 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-accent" aria-hidden />
          Security Log
        </h2>
        <p className="text-slate-400 text-xs mt-1 mb-2">
          Recent API interactions. Supports our{" "}
          <Link href="/security" className="text-teal-accent hover:underline">
            Security & Trust
          </Link>{" "}
          commitments.
        </p>
      </div>
      <div className="divide-y divide-white/10 max-h-[280px] overflow-y-auto">
        {logs.slice(0, 25).map((entry, i) => (
          <div
            key={entry.id ?? `log-${i}`}
            className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-slate-400" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm">{entry.endpoint}</p>
                <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" aria-hidden />
                  {formatDate(entry.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-sm font-medium ${statusColor(entry.status_code)}`}>
                {statusLabel(entry.status_code)}
              </span>
              {entry.credits_consumed > 0 && (
                <span className="text-teal-accent font-semibold tabular-nums text-sm">
                  {entry.credits_consumed} credit{entry.credits_consumed !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {logs.length > 25 && (
        <p className="p-3 text-center text-slate-500 text-xs border-t border-white/10">
          Showing latest 25 of {logs.length}
        </p>
      )}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/security"
          className="text-teal-accent hover:underline text-xs font-medium"
        >
          Security & Trust →
        </Link>
      </div>
    </section>
  );
}
