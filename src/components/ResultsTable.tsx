"use client";

import { Download } from "lucide-react";
import type { ExtractedRow } from "@/types";

type ResultsTableProps = {
  rows: ExtractedRow[];
};

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(rows: ExtractedRow[]) {
  const header = "Vendor Name,Total Amount,Date";
  const body = rows
    .map((r) =>
      [r.vendorName, r.totalAmount, r.date].map(escapeCsvCell).join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-data-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsTable({ rows }: ResultsTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">
          Extracted data ({rows.length} {rows.length === 1 ? "invoice" : "invoices"})
        </h2>
        <button
          type="button"
          onClick={() => downloadCsv(rows)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Download className="h-4 w-4" />
          Download as CSV
        </button>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/10">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-blue-100/80">
                Vendor Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-blue-100/80">
                Total Amount
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-blue-100/80">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 text-white">{row.vendorName || "—"}</td>
                <td className="px-4 py-3 text-white">{row.totalAmount || "—"}</td>
                <td className="px-4 py-3 text-white">{row.date || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
