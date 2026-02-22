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
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-200">
          Extracted data ({rows.length} {rows.length === 1 ? "invoice" : "invoices"})
        </h2>
        <button
          type="button"
          onClick={() => downloadCsv(rows)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface-950 hover:bg-accent-muted transition-colors"
        >
          <Download className="h-4 w-4" />
          Download as CSV
        </button>
      </div>
      <div className="rounded-xl border border-zinc-700/80 overflow-hidden bg-zinc-900/50">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-800/80">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Vendor Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Amount
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors"
              >
                <td className="px-4 py-3 text-zinc-200">{row.vendorName || "—"}</td>
                <td className="px-4 py-3 text-zinc-200">{row.totalAmount || "—"}</td>
                <td className="px-4 py-3 text-zinc-200">{row.date || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
