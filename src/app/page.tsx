"use client";

import { useState, useCallback } from "react";
import {
  FileUp,
  LayoutGrid,
  Download,
  ShoppingCart,
} from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import type { ExtractedRow } from "@/types";

type Plan = "starter" | "velopack";

export default function Home() {
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Extraction failed.");
      }
      if (data.extracted) {
        setRows((prev) => [...prev, data.extracted]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleCheckout = useCallback(async (plan: Plan) => {
    setError(null);
    setCheckoutPlan(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setCheckoutPlan(null);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        {/* Hero: central logo + headline */}
        <section className="text-center mb-12 flex flex-col items-center">
          <img
            src="/logo-png.png"
            alt="VeloDoc"
            width={200}
            height={80}
            className="w-[200px] h-auto drop-shadow-[0_0_25px_rgba(34,211,238,0.3)] mb-6"
          />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            VeloDoc: The 10-Second PDF-to-Sheet Architect
          </h1>
          <p className="mt-4 text-lg text-slate-200 max-w-2xl mx-auto">
            Turn PDF invoices into structured data in seconds. Upload, architect, export—silently.
          </p>
        </section>

        {/* Benefits Grid: centered under logo and headline */}
        <section className="flex justify-center mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl justify-items-center">
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/10 w-full max-w-[240px]">
              <FileUp className="h-10 w-10 text-teal-accent mb-3" />
              <h3 className="font-semibold text-white">Upload</h3>
              <p className="text-sm text-slate-300 mt-1">Drop your PDF invoice</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/10 w-full max-w-[240px]">
              <LayoutGrid className="h-10 w-10 text-teal-accent mb-3" />
              <h3 className="font-semibold text-white">Architect</h3>
              <p className="text-sm text-slate-300 mt-1">AI extracts vendor, amount, date</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/10 w-full max-w-[240px]">
              <Download className="h-10 w-10 text-teal-accent mb-3" />
              <h3 className="font-semibold text-white">Export</h3>
              <p className="text-sm text-slate-300 mt-1">Download as CSV or use in your tools</p>
            </div>
          </div>
        </section>

        {/* Upload in Glassmorphism Card */}
        <section className="mb-14">
          <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 sm:p-8">
            <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
            {error && (
              <p className="mt-3 text-sm text-red-300 text-center" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Simple, Silent Pricing */}
        <section id="pricing" className="mb-14 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Simple, Silent Pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-white">Starter</h3>
              <p className="mt-1 text-3xl font-bold text-white">$1.00</p>
              <p className="text-slate-300 text-sm mt-1">1 Credit</p>
              <p className="text-slate-400 text-sm mt-2">For quick one-off tasks.</p>
              <button
                type="button"
                onClick={() => handleCheckout("starter")}
                disabled={checkoutPlan !== null}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                {checkoutPlan === "starter" ? "Redirecting…" : "Get Starter"}
              </button>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 flex flex-col relative">
              <span className="absolute -top-2.5 right-4 rounded-full bg-lime-accent px-2 py-0.5 text-xs font-medium text-petroleum">
                Best value
              </span>
              <h3 className="text-lg font-semibold text-white">VeloPack</h3>
              <p className="mt-1 text-3xl font-bold text-white">$10.00</p>
              <p className="text-slate-300 text-sm mt-1">20 Credits</p>
              <p className="text-slate-400 text-sm mt-2">Best value for businesses.</p>
              <button
                type="button"
                onClick={() => handleCheckout("velopack")}
                disabled={checkoutPlan !== null}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                {checkoutPlan === "velopack" ? "Redirecting…" : "Get VeloPack"}
              </button>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="text-center">
          <p className="text-sm text-slate-400 mb-4">Works with your favorite tools</p>
          <div className="flex flex-wrap items-center justify-center gap-8 grayscale opacity-80">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 border border-white/10">
              <span className="text-sm font-medium text-white">Excel</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 border border-white/10">
              <span className="text-sm font-medium text-white">Google Sheets</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 border border-white/10">
              <span className="text-sm font-medium text-white">QuickBooks</span>
            </div>
          </div>
        </section>

        {/* Table + CSV */}
        <section className="mt-14">
          <ResultsTable rows={rows} />
        </section>
      </div>
    </main>
  );
}
