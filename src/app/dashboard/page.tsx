"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { FileUp, Sparkles, Download, Info, FileText, Layers, Clock } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import type { ExtractedRow } from "@/types";

const VELOPACK_SIZE = 20;

function useUsageStats(rows: ExtractedRow[], creditsRemaining: number | null) {
  return useMemo(() => {
    const documents = rows.length;
    const lineItems = rows.reduce((sum, r) => sum + (r.lineItems?.length ?? 0), 0);
    const minutesSaved = documents * 5 + lineItems * 1;
    const hoursSaved = Math.round((minutesSaved / 60) * 10) / 10;
    const remaining = creditsRemaining ?? 0;
    const creditsTotal = Math.max(VELOPACK_SIZE, remaining);
    const creditsUsed = creditsTotal - remaining;
    return {
      documents,
      lineItems,
      hoursSaved,
      creditsUsed,
      creditsTotal,
      creditsRemaining: remaining,
    };
  }, [rows, creditsRemaining]);
}

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
  const stats = useUsageStats(rows, credits);

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

        <section className="mb-8 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-5">
              Usage & Insights
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-300">Credits Used</span>
                  <span className="font-medium text-white">
                    {stats.creditsUsed}/{stats.creditsTotal}{" "}
                    <span className="text-cyan-400/90">VeloPack credits</span>
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, (stats.creditsUsed / stats.creditsTotal) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white tabular-nums">{stats.documents}</p>
                    <p className="text-xs text-slate-400">Total Documents Architected</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Layers className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white tabular-nums">{stats.lineItems}</p>
                    <p className="text-xs text-slate-400">Total Line Items Extracted</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white tabular-nums">{stats.hoursSaved}h</p>
                    <p className="text-xs text-slate-400">Estimated Hours Saved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
