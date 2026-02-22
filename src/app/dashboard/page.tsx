"use client";

import { useState, useCallback, useEffect } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import type { ExtractedRow } from "@/types";

export default function DashboardPage() {
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      const data = await res.json();
      if (res.ok && typeof data.credits === "number") setCredits(data.credits);
    } catch {
      setCredits(0);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleFileSelect = useCallback(
    async (file: File) => {
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
          if (typeof data.remaining === "number") setCredits(data.remaining);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Architect</h1>
          {credits !== null && (
            <p className="text-slate-300">
              <span className="font-medium text-teal-accent">{credits}</span>{" "}
              credits
            </p>
          )}
        </div>

        <section className="mb-10">
          <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 sm:p-8">
            <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
            {error && (
              <p className="mt-3 text-sm text-red-300 text-center" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        <section>
          <ResultsTable rows={rows} />
        </section>
      </div>
    </main>
  );
}
