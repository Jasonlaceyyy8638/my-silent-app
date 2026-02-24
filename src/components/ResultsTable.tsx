"use client";

import { useState } from "react";
import { Check, Download, FileSpreadsheet, Lock, Pencil, RefreshCw, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { ExtractedRow } from "@/types";
import type { DocumentWithRow } from "@/app/api/documents/route";
import type { MeRole, MePlan } from "@/app/api/me/route";
import { SyncDestinationModal } from "@/components/SyncDestinationModal";
import type { FolderId } from "@/components/DashboardCategorySidebar";

type ResultsTableProps = {
  documents: DocumentWithRow[];
  currentUserId: string | null;
  userRole: MeRole;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, updates: { file_name?: string; extracted_data?: ExtractedRow }) => Promise<void>;
  onSyncSuccess?: () => void;
  onSyncError?: (message: string) => void;
  onSyncStart?: () => void;
  /** When set, table shows folder-specific columns (e.g. Intuit TID for Financial, Reference Number for Logistics). */
  selectedFolder?: FolderId;
  /** When 'free', CSV/Excel export is disabled with upgrade tooltip. */
  plan?: MePlan;
};

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(rows: ExtractedRow[], filename?: string) {
  const hasLineItems = rows.some((r) => r.lineItems && r.lineItems.length > 0);
  let header: string;
  let body: string;

  if (hasLineItems) {
    header =
      "Vendor Name,Date,Total Amount,SKU,Part Description,Quantity,Unit Cost,Line Total";
    const lineRows: string[] = [];
    for (const r of rows) {
      if (r.lineItems && r.lineItems.length > 0) {
        for (const li of r.lineItems) {
          lineRows.push(
            [
              r.vendorName,
              r.date,
              r.totalAmount,
              li.sku,
              li.partDescription,
              li.quantity ?? "",
              li.unitCost,
              li.lineTotal ?? "",
            ]
              .map(escapeCsvCell)
              .join(",")
          );
        }
      } else {
        lineRows.push(
          [r.vendorName, r.date, r.totalAmount, "", "", "", "", ""]
            .map(escapeCsvCell)
            .join(",")
        );
      }
    }
    body = lineRows.join("\n");
  } else {
    header = "Vendor Name,Total Amount,Date";
    body = rows
      .map((r) =>
        [r.vendorName, r.totalAmount, r.date].map(escapeCsvCell).join(",")
      )
      .join("\n");
  }

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `velodoc-extract-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 40) || "document";
}

function downloadExcel(rows: ExtractedRow[], filename?: string) {
  const hasLineItems = rows.some((r) => r.lineItems && r.lineItems.length > 0);
  let data: string[][];

  if (hasLineItems) {
    const header = [
      "Vendor Name",
      "Date",
      "Total Amount",
      "SKU",
      "Part Description",
      "Quantity",
      "Unit Cost",
      "Line Total",
    ];
    const body: string[][] = [];
    for (const r of rows) {
      if (r.lineItems && r.lineItems.length > 0) {
        for (const li of r.lineItems) {
          body.push([
            r.vendorName,
            r.date,
            r.totalAmount,
            li.sku,
            li.partDescription,
            li.quantity ?? "",
            li.unitCost,
            li.lineTotal ?? "",
          ]);
        }
      } else {
        body.push([r.vendorName, r.date, r.totalAmount, "", "", "", "", ""]);
      }
    }
    data = [header, ...body];
  } else {
    const header = ["Vendor Name", "Total Amount", "Date"];
    data = [header, ...rows.map((r) => [r.vendorName, r.totalAmount, r.date])];
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `velodoc-extract-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsTable({ documents, currentUserId, userRole, onDelete, onEdit, onSyncSuccess, onSyncError, onSyncStart, selectedFolder = "all", plan }: ResultsTableProps) {
  const [editDoc, setEditDoc] = useState<DocumentWithRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showExportPaywall, setShowExportPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const canExport = plan !== "free";
  const [syncModalDocId, setSyncModalDocId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExportClick = (doExport: () => void) => {
    if (canExport) doExport();
    else setShowExportPaywall(true);
  };

  const handleUpgradeToStarter = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "starter" }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else setCheckoutLoading(false);
    } catch {
      setCheckoutLoading(false);
    }
  };

  const isViewer = userRole === "viewer";
  const showIntuitTid = selectedFolder === "Financial";
  const showReferenceNumber = selectedFolder === "Logistics";

  const handlePushToQuickBooks = async (documentId: string) => {
    const res = await fetch("/api/quickbooks/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok === true) {
      onSyncSuccess?.();
    } else {
      const message = typeof data?.error === "string" ? data.error : "Sync to QuickBooks failed.";
      onSyncError?.(message);
      throw new Error(message);
    }
  };

  const rows = documents.map((d) => d.extracted_data);
  const canEdit = userRole === "admin" || userRole === "editor" || userRole === null;
  const canDelete = (doc: DocumentWithRow) =>
    userRole === "admin" || (userRole === "editor" && currentUserId !== null && doc.user_id === currentUserId) || (userRole === null && currentUserId !== null && doc.user_id === currentUserId);

  if (documents.length === 0) return null;

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editDoc) return;
    const form = e.currentTarget;
    const file_name = (form.querySelector('[name="file_name"]') as HTMLInputElement)?.value?.trim();
    const vendorName = (form.querySelector('[name="vendorName"]') as HTMLInputElement)?.value?.trim() ?? editDoc.extracted_data.vendorName;
    const totalAmount = (form.querySelector('[name="totalAmount"]') as HTMLInputElement)?.value?.trim() ?? editDoc.extracted_data.totalAmount;
    const date = (form.querySelector('[name="date"]') as HTMLInputElement)?.value?.trim() ?? editDoc.extracted_data.date;
    setIsSubmitting(true);
    try {
      await onEdit(editDoc.id, {
        ...(file_name !== undefined && file_name !== editDoc.file_name ? { file_name } : {}),
        extracted_data: { ...editDoc.extracted_data, vendorName, totalAmount, date },
      });
      setEditDoc(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">
          Extracted data ({documents.length}{" "}
          {documents.length === 1 ? "document" : "documents"})
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExportClick(() => downloadExcel(rows))}
            title={!canExport ? "Upgrade to Starter to unlock exports." : undefined}
            className={
              canExport
                ? "inline-flex items-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2 text-sm font-medium transition-colors"
                : "inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 text-slate-400 px-4 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-white/10 hover:text-slate-300"
            }
          >
            {!canExport && <Lock className="h-4 w-4 shrink-0" />}
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </button>
          <button
            type="button"
            onClick={() => handleExportClick(() => downloadCsv(rows))}
            title={!canExport ? "Upgrade to Starter to unlock exports." : undefined}
            className={
              canExport
                ? "inline-flex items-center gap-2 rounded-lg border border-teal-accent/50 bg-teal-accent/10 hover:bg-teal-accent/20 text-teal-accent px-4 py-2 text-sm font-medium transition-colors"
                : "inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 text-slate-400 px-4 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-white/10 hover:text-slate-300"
            }
          >
            {!canExport && <Lock className="h-4 w-4 shrink-0" />}
            <Download className="h-4 w-4" />
            {documents.length > 1 ? "Download all as CSV" : "Download as CSV"}
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 divide-y divide-white/10">
        {documents.map((doc) => {
          const row = doc.extracted_data;
          const name = safeFilename(row.vendorName || "document");
          const datePart = row.date ? safeFilename(row.date) : "";
          const oneFilename = `velodoc-${name}-${datePart || doc.id.slice(0, 8)}.csv`;
          return (
            <div key={doc.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className={`grid grid-cols-1 gap-3 text-sm flex-1 min-w-0 ${showIntuitTid || showReferenceNumber ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-xs">Vendor</span>
                    <p className="text-white font-medium mt-0.5">{row.vendorName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-xs">Total</span>
                    <p className="text-white font-medium mt-0.5">{row.totalAmount || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-xs">Date</span>
                    <p className="text-white font-medium mt-0.5">{row.date || "—"}</p>
                  </div>
                  {showIntuitTid && (
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-xs">Intuit TID</span>
                      <p className="text-[#22d3ee] font-mono text-xs mt-0.5">{doc.intuit_tid || "—"}</p>
                    </div>
                  )}
                  {showReferenceNumber && (
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-xs">Reference #</span>
                      <p className="text-white font-medium mt-0.5">{row.referenceNumber || "—"}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => (canExport ? downloadCsv([row], oneFilename) : setShowExportPaywall(true))}
                    title={!canExport ? "Upgrade to Starter to unlock exports." : undefined}
                    className={
                      canExport
                        ? "inline-flex items-center gap-1.5 rounded-lg border border-teal-accent/50 bg-teal-accent/10 hover:bg-teal-accent/20 text-teal-accent px-3 py-1.5 text-xs font-medium transition-colors"
                        : "inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 text-slate-400 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer hover:bg-white/10 hover:text-slate-300"
                    }
                  >
                    {!canExport && <Lock className="h-3.5 w-3.5 shrink-0" />}
                    <Download className="h-3.5 w-3.5" />
                    Download CSV
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditDoc(doc)}
                      className="inline-flex items-center justify-center rounded-lg border border-[#22d3ee]/50 bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 text-[#22d3ee] p-2 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {doc.extracted_data && (
                    <>
                      {isViewer ? (
                        <span
                          className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-slate-400"
                          title="Viewers have read-only access"
                        >
                          Read-only
                        </span>
                      ) : doc.qb_sync_status === "synced" ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#22d3ee]/50 bg-[#22d3ee]/10 backdrop-blur-sm px-2.5 py-1.5 text-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                          title={doc.intuit_tid ? `Synced (Bill Id: ${doc.intuit_tid})` : "Synced to QuickBooks"}
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="text-xs font-medium">Synced</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSyncModalDocId(doc.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#22d3ee]/50 bg-[#22d3ee]/10 backdrop-blur-sm px-2.5 py-1.5 text-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all hover:bg-[#22d3ee]/20 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]"
                          aria-label="Choose sync destination"
                        >
                          <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="text-xs font-medium">Sync</span>
                        </button>
                      )}
                    </>
                  )}
                  {canDelete(doc) && (
                    <button
                      type="button"
                      onClick={() => setDeleteId(doc.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-400/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className="rounded-2xl border border-white/20 bg-[#0f172a]/95 backdrop-blur-xl p-6 w-full max-w-md border-t-teal-accent/30 shadow-xl">
            <h3 id="edit-modal-title" className="text-lg font-semibold text-white mb-4">Edit document</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-file_name" className="block text-slate-400 text-xs uppercase tracking-wider mb-1">File name</label>
                <input
                  id="edit-file_name"
                  name="file_name"
                  type="text"
                  defaultValue={editDoc.file_name}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-teal-accent focus:outline-none focus:ring-1 focus:ring-teal-accent"
                />
              </div>
              <div>
                <label htmlFor="edit-vendorName" className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Vendor</label>
                <input
                  id="edit-vendorName"
                  name="vendorName"
                  type="text"
                  defaultValue={editDoc.extracted_data.vendorName}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-teal-accent focus:outline-none focus:ring-1 focus:ring-teal-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-totalAmount" className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Total</label>
                  <input
                    id="edit-totalAmount"
                    name="totalAmount"
                    type="text"
                    defaultValue={editDoc.extracted_data.totalAmount}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-teal-accent focus:outline-none focus:ring-1 focus:ring-teal-accent"
                  />
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Date</label>
                  <input
                    id="edit-date"
                    name="date"
                    type="text"
                    defaultValue={editDoc.extracted_data.date}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-teal-accent focus:outline-none focus:ring-1 focus:ring-teal-accent"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditDoc(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#0b172a] hover:bg-[#22d3ee]/90 disabled:opacity-70 transition-colors">
                  {isSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {syncModalDocId && (
        <SyncDestinationModal
          documentId={syncModalDocId}
          onClose={() => setSyncModalDocId(null)}
          onPushToQuickBooks={handlePushToQuickBooks}
          onSyncError={onSyncError}
          onSyncStart={onSyncStart}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="rounded-2xl border border-white/20 bg-[#0f172a]/95 backdrop-blur-xl p-6 w-full max-w-sm border-t-red-400/30 shadow-xl">
            <h3 id="delete-modal-title" className="text-lg font-semibold text-white mb-2">Remove document?</h3>
            <p className="text-slate-400 text-sm mb-6">This will permanently remove the file and its extracted data.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteId(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteConfirm} disabled={isSubmitting} className="rounded-lg bg-red-500/20 border border-red-400/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-70 transition-colors">
                {isSubmitting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export paywall modal (Free tier) */}
      {showExportPaywall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-paywall-title"
        >
          <div className="rounded-2xl border border-[#22d3ee]/40 bg-slate-900/98 backdrop-blur-xl w-full max-w-md p-6 shadow-[0_0_32px_rgba(34,211,238,0.15)] border-t-[#22d3ee]/50">
            <h2 id="export-paywall-title" className="text-lg font-semibold text-white uppercase tracking-wider text-[#22d3ee]">
              Unlock Professional Data Exports
            </h2>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              Exporting your extracted data to CSV and Excel is a Starter feature. Upgrade now to preserve your records and streamline your workflow.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleUpgradeToStarter}
                disabled={checkoutLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-[#0b172a] font-semibold px-4 py-3 text-sm transition-colors disabled:opacity-70 disabled:pointer-events-none shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                {checkoutLoading ? "Redirecting…" : "Upgrade to Starter — $29/mo"}
              </button>
              <button
                type="button"
                onClick={() => setShowExportPaywall(false)}
                className="w-full inline-flex items-center justify-center rounded-xl border border-white/20 hover:bg-white/10 text-slate-300 px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>
            <p className="mt-4 text-center">
              <a
                href="mailto:support@velodoc.app?subject=Export%20%26%20Starter%20plan"
                className="text-xs text-[#22d3ee]/90 hover:text-[#22d3ee] transition-colors"
              >
                Questions? Contact support@velodoc.app
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
