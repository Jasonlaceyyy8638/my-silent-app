"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, History } from "lucide-react";
import type { SyncedDocumentEntry, FailedSyncEntry } from "@/app/api/sync-history/route";
import type { MeRole, MePlan } from "@/app/api/me/route";

function escapeCsvCell(value: string): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Converts the current filtered view of synced documents to CSV and triggers a browser download.
 * Only includes records the user is authorized to see (API already filters by role).
 */
function exportSyncHistoryToCSV(rows: SyncedDocumentEntry[]): void {
  const header = ["File", "Vendor", "Total", "Date", "Bill Id", "Synced at"];
  const body = rows.map((r) =>
    [
      r.file_name,
      r.vendor,
      r.total,
      r.date,
      r.intuit_tid ?? "",
      r.created_at,
    ].map(escapeCsvCell).join(",")
  );
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `velodoc-sync-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
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

export default function SyncHistoryPage() {
  const [syncedDocuments, setSyncedDocuments] = useState<SyncedDocumentEntry[]>([]);
  const [failedSyncs, setFailedSyncs] = useState<FailedSyncEntry[]>([]);
  const [userRole, setUserRole] = useState<MeRole>(null);
  const [plan, setPlan] = useState<MePlan>("starter");
  const [loading, setLoading] = useState(true);
  const [expandedFailedId, setExpandedFailedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, meRes] = await Promise.all([
        fetch("/api/sync-history"),
        fetch("/api/me"),
      ]);
      const historyData = await historyRes.json().catch(() => ({}));
      const meData = await meRes.json().catch(() => ({}));
      if (historyRes.ok) {
        if (Array.isArray(historyData.syncedDocuments)) setSyncedDocuments(historyData.syncedDocuments);
        if (Array.isArray(historyData.failedSyncs)) setFailedSyncs(historyData.failedSyncs);
      }
      if (meRes.ok) {
        if (meData.role !== undefined) setUserRole(meData.role as MeRole);
        if (meData.plan === "starter" || meData.plan === "pro" || meData.plan === "enterprise" || meData.plan === "free") setPlan(meData.plan);
      }
    } catch {
      setSyncedDocuments([]);
      setFailedSyncs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdmin = userRole === "admin";
  const canExportWeeklyCsv = isAdmin || plan === "enterprise";

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-accent text-sm font-medium mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="h-6 w-6 text-[#22d3ee]" />
              Sync History
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              QuickBooks synced documents and failed sync attempts. {isAdmin ? "Full organization." : "Your uploads only."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl p-8 text-center text-slate-400">
            Loading…
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-[#22d3ee]/20 bg-white/[0.07] backdrop-blur-xl border-t-[#22d3ee]/30 shadow-[0_0_24px_rgba(34,211,238,0.08)] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Synced to QuickBooks</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Documents with qb_sync_status = synced</p>
                </div>
                {canExportWeeklyCsv && (
                  <button
                    type="button"
                    onClick={() => exportSyncHistoryToCSV(syncedDocuments)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/40 bg-white/5 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-[#22d3ee] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee]/60 transition-colors shrink-0"
                    aria-label="Export sync history to CSV"
                  >
                    <Download className="h-4 w-4" />
                    Export to CSV
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">File</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Vendor</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Total</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Bill Id</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Synced at</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {syncedDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                          No synced documents yet.
                        </td>
                      </tr>
                    ) : (
                      syncedDocuments.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white font-medium">{row.file_name}</td>
                          <td className="py-3 px-4 text-slate-300">{row.vendor}</td>
                          <td className="py-3 px-4 text-slate-300">{row.total}</td>
                          <td className="py-3 px-4 text-slate-300">{row.date}</td>
                          <td className="py-3 px-4 text-[#22d3ee] font-mono text-xs">{row.intuit_tid ?? "—"}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{formatDate(row.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {isAdmin && (
              <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-red-400/20 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Failed syncs (Admin)</h2>
                  <p className="text-slate-400 text-xs mt-0.5">From api_logs for troubleshooting</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">When</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Document Id</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {failedSyncs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 px-4 text-center text-slate-500">
                            No failed syncs.
                          </td>
                        </tr>
                      ) : (
                        failedSyncs.map((row) => (
                          <tr key={row.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-slate-400 text-xs">{formatDate(row.created_at)}</td>
                            <td className="py-3 px-4 text-slate-300 font-mono text-xs">{row.document_id ?? "—"}</td>
                            <td className="py-3 px-4">
                              <span className="text-red-400 font-medium">{row.status_code}</span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setExpandedFailedId(expandedFailedId === row.id ? null : row.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#22d3ee]/50 bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 text-[#22d3ee] px-2.5 py-1.5 text-xs font-medium transition-colors"
                                aria-label="View details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                              {expandedFailedId === row.id && (
                                <div className="mt-2 rounded-lg border border-white/20 bg-[#0f172a]/90 p-3 text-xs text-slate-300 space-y-1.5">
                                  {row.intuit_tid != null && row.intuit_tid !== "" && (
                                    <p><span className="text-slate-500">intuit_tid:</span> <span className="font-mono text-[#22d3ee]">{row.intuit_tid}</span></p>
                                  )}
                                  {row.error_message != null && row.error_message !== "" && (
                                    <p><span className="text-slate-500">error:</span> <span className="text-red-300">{row.error_message}</span></p>
                                  )}
                                  {(!row.intuit_tid || row.intuit_tid === "") && (!row.error_message || row.error_message === "") && (
                                    <p className="text-slate-500">No details stored for this log entry.</p>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!isAdmin && failedSyncs.length > 0 && (
              <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Your failed syncs</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Contact an Admin to view intuit_tid and error details.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">When</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Document Id</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {failedSyncs.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-slate-400 text-xs">{formatDate(row.created_at)}</td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs">{row.document_id ?? "—"}</td>
                          <td className="py-3 px-4 text-red-400 font-medium">{row.status_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
