"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { ExtractedRow } from "@/types";
import type { DocumentWithRow } from "@/app/api/documents/route";
import type { MeRole } from "@/app/api/me/route";

type ResultsTableProps = {
  documents: DocumentWithRow[];
  currentUserId: string | null;
  userRole: MeRole;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, updates: { file_name?: string; extracted_data?: ExtractedRow }) => Promise<void>;
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

export function ResultsTable({ documents, currentUserId, userRole, onDelete, onEdit }: ResultsTableProps) {
  const [editDoc, setEditDoc] = useState<DocumentWithRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            onClick={() => downloadExcel(rows)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2 text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(rows)}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-accent/50 bg-teal-accent/10 hover:bg-teal-accent/20 text-teal-accent px-4 py-2 text-sm font-medium transition-colors"
          >
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm flex-1 min-w-0">
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
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadCsv([row], oneFilename)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-accent/50 bg-teal-accent/10 hover:bg-teal-accent/20 text-teal-accent px-3 py-1.5 text-xs font-medium transition-colors"
                  >
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
    </div>
  );
}
