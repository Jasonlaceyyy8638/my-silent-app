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

export function ResultsTable({ rows }: ResultsTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">
          Extracted data ({rows.length}{" "}
          {rows.length === 1 ? "document" : "documents"})
        </h2>
        <button
          type="button"
          onClick={() => downloadCsv(rows)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2 text-sm font-medium transition-colors"
        >
          <Download className="h-4 w-4" />
          {rows.length > 1 ? "Download all as CSV" : "Download as CSV"}
        </button>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 divide-y divide-white/10">
        {rows.map((row, i) => {
          const name = safeFilename(row.vendorName || "document");
          const datePart = row.date ? safeFilename(row.date) : "";
          const oneFilename = `velodoc-${name}-${datePart || i + 1}.csv`;
          return (
            <div key={i} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm flex-1 min-w-0">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-xs">
                      Vendor
                    </span>
                    <p className="text-white font-medium mt-0.5">{row.vendorName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-xs">
                      Total
                    </span>
                    <p className="text-white font-medium mt-0.5">{row.totalAmount || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-xs">
                      Date
                    </span>
                    <p className="text-white font-medium mt-0.5">{row.date || "—"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCsv([row], oneFilename)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-accent/50 bg-teal-accent/10 hover:bg-teal-accent/20 text-teal-accent px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
