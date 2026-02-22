"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  FileUp,
  Sparkles,
  Download,
  Info,
  FileText,
  Layers,
  Clock,
  Plug,
  Zap,
  FolderSync,
  FileSpreadsheet,
} from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import type { ExtractedRow } from "@/types";

type DashboardTab = "architect" | "integrations";

const INTEGRATION_CARDS = [
  { id: "quickbooks", name: "QuickBooks", icon: Plug, description: "Sync extracted data to your books." },
  { id: "zapier", name: "Zapier", icon: Zap, description: "Connect to 5,000+ apps automatically." },
  { id: "gdrive", name: "Google Drive", icon: FolderSync, description: "Import and export from Drive." },
  { id: "excel", name: "Excel Online", icon: FileSpreadsheet, description: "Open and edit spreadsheets in the cloud." },
] as const;

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
  const [tab, setTab] = useState<DashboardTab>("architect");
  const [waitlistJoined, setWaitlistJoined] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const stats = useUsageStats(rows, credits);

  const handleJoinWaitlist = useCallback((id: string) => {
    setWaitlistJoined((prev) => new Set(prev).add(id));
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      const data = await res.json();
      if (res.ok && typeof data.credits === "number") {
        setCredits(data.credits);
        setError(null);
      } else {
        setCredits(0);
        setError(
          data?.error ?? (res.status === 401 ? "Sign in to see credits." : "Could not load credits.")
        );
      }
    } catch {
      setCredits(0);
      setError("Could not load credits. Check DATABASE_URL on Netlify.");
    }
  }, []);

  const fetchSavedDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok && Array.isArray(data.rows)) {
        setRows(data.rows);
      }
    } catch {
      // keep existing rows
    }
  }, []);

  useEffect(() => {
    fetchCredits();
    fetchSavedDocuments();
  }, [fetchCredits, fetchSavedDocuments]);

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
        const text = await res.text();
        let data: {
          extracted?: ExtractedRow;
          remaining?: number;
          error?: string;
          saveFailed?: boolean;
          saveError?: string;
          supabaseErrorCode?: string | null;
          supabaseErrorMessage?: string | null;
        };
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          const statusInfo = ` (HTTP ${res.status})`;
          const preview = text?.slice(0, 150)?.trim() || "(empty)";
          throw new Error(
            `Extraction failed${statusInfo}. Response: ${preview}${preview.length >= 150 ? "…" : ""}`
          );
        }
        if (!res.ok) {
          const rawMsg = data.error || "";
          const hasDetail = rawMsg && rawMsg !== "Extraction failed.";
          const msg =
            res.status === 500 && !hasDetail
              ? "Server error (500). Set OPENAI_API_KEY and DATABASE_URL in Netlify → Site settings → Environment variables, then redeploy. Check the Deploys tab for build logs."
              : rawMsg || "Extraction failed.";
          const supabaseInfo =
            data.supabaseErrorCode != null || data.supabaseErrorMessage != null
              ? ` — Supabase: ${data.supabaseErrorCode ?? "—"} ${data.supabaseErrorMessage ?? ""}`.trim()
              : "";
          throw new Error(`${msg}${supabaseInfo} [HTTP ${res.status}]`);
        }
        if (data.extracted) {
          setRows((prev) => [...prev, data.extracted as ExtractedRow]);
          if (typeof data.remaining === "number") setCredits(data.remaining);
          fetchSavedDocuments();
          if (data.saveFailed) {
            const friendly = data.saveError && data.supabaseErrorCode === "PGRST205"
              ? "Saved to this session. To also save to Supabase, create the documents table (see docs/DATABASE.md)."
              : (data.supabaseErrorCode || data.supabaseErrorMessage)
                ? `Saved locally. Database save failed: ${data.supabaseErrorCode ?? ""} ${data.supabaseErrorMessage ?? ""}`.trim()
                : null;
            if (friendly) setError(friendly);
          }
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">PDF Architect</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Extract and organize data from any PDF
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-lg border border-white/15 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setTab("architect")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "architect"
                    ? "bg-teal-accent/20 text-teal-accent"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Architect
              </button>
              <button
                type="button"
                onClick={() => setTab("integrations")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "integrations"
                    ? "bg-teal-accent/20 text-teal-accent"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Integrations
              </button>
            </div>
            {credits !== null && tab === "architect" && (
              <p className="text-slate-300 flex items-center gap-2">
                <span className="font-medium text-teal-accent">{credits}</span>
                credits
                <button
                  type="button"
                  onClick={() => fetchCredits()}
                  className="text-slate-500 hover:text-teal-accent text-xs underline"
                >
                  Refresh
                </button>
              </p>
            )}
          </div>
        </div>

        {tab === "integrations" && (
          <section className="mb-10">
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
              <h2 className="text-lg font-semibold text-white mb-2">Integrations</h2>
              <p className="text-slate-400 text-sm mb-8">
                Connect VeloDoc to your stack. Join the waitlist to be first in line.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {INTEGRATION_CARDS.map(({ id, name, icon: Icon, description }) => {
                  const joined = waitlistJoined.has(id);
                  return (
                    <div
                      key={id}
                      className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 flex flex-col border-t-teal-accent/30"
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-teal-accent" />
                      </div>
                      <h3 className="font-semibold text-white">{name}</h3>
                      <p className="text-slate-400 text-sm mt-1 flex-1">{description}</p>
                      <span className="mt-3 inline-block rounded-full bg-petroleum/80 border border-teal-accent/30 px-3 py-1 text-xs font-medium text-teal-accent w-fit">
                        Coming Soon
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJoinWaitlist(id)}
                        disabled={joined}
                        className="mt-4 w-full rounded-lg bg-teal-accent/20 hover:bg-teal-accent/30 text-teal-accent border border-teal-accent/40 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-70 disabled:pointer-events-none"
                      >
                        {joined ? "You're on the list" : "Join Waitlist"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {tab === "architect" && (
          <>
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
          </>
        )}
      </div>
    </main>
  );
}
