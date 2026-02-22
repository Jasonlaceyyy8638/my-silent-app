"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUp, Sparkles, Download, Info } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import type { ExtractedRow } from "@/types";

const GETTING_STARTED_STEPS = [
  {
    icon: FileUp,
    title: "Drop & Drive",
    description: "Drag any PDF here. No templates or pre-formatting required.",
  },
  {
    icon: Sparkles,
    title: "Watch the Architect",
    description: "Our AI maps out the data in seconds.",
  },
  {
    icon: Download,
    title: "Take Your Data",
    description: "Download your structured data and get back to your day.",
  },
] as const;

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
          <div>
            <h1 className="text-2xl font-bold text-white">PDF Architect</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Extract and organize data from any PDF
            </p>
          </div>
          {credits !== null && (
            <p className="text-slate-300">
              <span className="font-medium text-teal-accent">{credits}</span>{" "}
              credits
            </p>
          )}
        </div>

        <section className="mb-8">
          <div className="rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-md p-6 sm:p-8 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-5">Getting Started</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              {GETTING_STARTED_STEPS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-accent/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-teal-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{title}</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
              <span>
                VeloDoc understands context. Whether it&apos;s a 20-page legal contract or a single repair invoice, we see what others miss.
              </span>
            </p>
          </div>
        </section>

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
