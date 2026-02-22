"use client";

import { useState, useCallback } from "react";
import { ShoppingCart } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import type { ExtractedRow } from "@/types";

export default function Home() {
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
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

  const handleBuyCredits = useCallback(async () => {
    setError(null);
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setIsCheckingOut(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-surface-950">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        {/* Hero */}
        <section className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Clean Your Data Silently.
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-xl mx-auto">
            Upload a PDF invoice and we&apos;ll extract vendor, total amount, and date—no fuss.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleBuyCredits}
              disabled={isCheckingOut}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-surface-950 hover:bg-accent-muted disabled:opacity-70 disabled:pointer-events-none transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              {isCheckingOut ? "Redirecting…" : "Buy 10 Credits"}
            </button>
          </div>
        </section>

        {/* Drag & Drop */}
        <section className="mb-12">
          <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
          {error && (
            <p className="mt-3 text-sm text-red-400 text-center" role="alert">
              {error}
            </p>
          )}
        </section>

        {/* Table + CSV */}
        <ResultsTable rows={rows} />
      </div>
    </main>
  );
}
