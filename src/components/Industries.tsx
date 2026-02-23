"use client";

import { useState } from "react";
import { FileText, Table2 } from "lucide-react";

const INDUSTRIES = [
  {
    id: "logistics",
    label: "Logistics & Trucking",
    focus: "BOLs and Rate Confirmations",
    beforeLabel: "Messy BOLs & rate sheets",
    afterLabel: "Structured carrier, rate, date",
    beforePreview: "Scanned BOLs, handwritten rates, multi-format carrier docs",
    tableHeaders: ["Carrier", "Rate", "Date", "Reference"],
    tableRows: [
      ["ABC Freight", "$1,250.00", "2025-02-15", "BOL-8842"],
      ["National Trucking", "$890.00", "2025-02-14", "RC-9921"],
    ],
  },
  {
    id: "home",
    label: "Home Services",
    focus: "Garage door vendor invoices & part numbers",
    beforeLabel: "Vendor invoices & POs",
    afterLabel: "Part numbers & line items",
    beforePreview: "Amarr, Clopay invoices with SKUs and quantities scattered",
    tableHeaders: ["Part #", "Description", "Qty", "Unit $", "Total"],
    tableRows: [
      ["AM-2042", "Sectional door spring", "2", "$45.00", "$90.00"],
      ["CL-8801", "Opener rail kit", "1", "$120.00", "$120.00"],
    ],
  },
  {
    id: "legal",
    label: "Legal & Corporate",
    focus: "Contracts and transcripts",
    beforeLabel: "Multi-page contracts & transcripts",
    afterLabel: "Key terms & structured data",
    beforePreview: "Dense contracts, deposition transcripts, key dates buried",
    tableHeaders: ["Party", "Type", "Effective", "Key term"],
    tableRows: [
      ["Acme Corp", "MSA", "2025-01-01", "Auto-renew 12 mo"],
      ["Smith LLC", "NDA", "2025-02-01", "2-year term"],
    ],
  },
] as const;

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export function Industries() {
  const [active, setActive] = useState<(typeof INDUSTRIES)[number]["id"]>("logistics");
  const current = INDUSTRIES.find((i) => i.id === active) ?? INDUSTRIES[0];

  return (
    <section className="mb-14">
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
        Built for your industry
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        Click a tab to see how messy documents become clean, structured data.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {INDUSTRIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              active === id
                ? "bg-teal-accent text-petroleum"
                : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white border border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto ${CARD_CLASS} p-6 sm:p-8`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs font-mono uppercase tracking-wider">
            <FileText className="w-4 h-4 text-slate-500" aria-hidden />
            Before
          </div>
          <div className="rounded-xl border border-white/15 bg-slate-900/60 p-5 min-h-[180px] flex flex-col justify-center">
            <p className="text-slate-500 text-sm font-medium mb-2">{current.beforeLabel}</p>
            <p className="text-slate-600 text-xs leading-relaxed">{current.beforePreview}</p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-2 rounded bg-slate-700/80"
                  style={{ width: `${60 + i * 20}%` }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-teal-accent text-xs font-mono uppercase tracking-wider">
            <Table2 className="w-4 h-4" aria-hidden />
            After
          </div>
          <div className="rounded-xl border border-teal-accent/20 bg-teal-accent/5 overflow-hidden min-h-[180px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {current.tableHeaders.map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.tableRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-white/5 last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2.5 px-3 text-white font-medium">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
