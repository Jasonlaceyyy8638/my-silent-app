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
  LayoutGrid,
  Users,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import { UsageHistory, type UsageEntry } from "@/components/UsageHistory";
import { SecurityLog, type SecurityLogEntry } from "@/components/SecurityLog";
import { QuickBooksIcon, ExcelIcon, ZapierIcon, GoogleDriveIcon } from "@/components/integration-icons";
import type { ExtractedRow } from "@/types";
import type { DocumentWithRow } from "@/app/api/documents/route";
import type { MeRole } from "@/app/api/me/route";

type DashboardTab = "architect" | "integrations" | "team";

const INTEGRATION_CARDS = [
  { id: "quickbooks", name: "QuickBooks", Icon: QuickBooksIcon, description: "Sync extracted data to your books.", bento: "large" as const },
  { id: "excel", name: "Excel", Icon: ExcelIcon, description: "Export to spreadsheets in the cloud.", bento: "medium" as const },
  { id: "zapier", name: "Zapier", Icon: ZapierIcon, description: "Connect to 5,000+ apps automatically.", bento: "medium" as const },
  { id: "gdrive", name: "Google Drive", Icon: GoogleDriveIcon, description: "Import and export from Drive.", bento: "small" as const },
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
  const [documents, setDocuments] = useState<DocumentWithRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<MeRole>(null);
  const rows = useMemo(() => documents.map((d) => d.extracted_data), [documents]);
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
      if (res.ok) {
        if (Array.isArray(data.documents)) setDocuments(data.documents);
        if (Array.isArray(data.usage)) setUsage(data.usage);
      }
    } catch {
      // keep existing
    }
  }, []);

  const fetchApiLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/api-logs");
      const data = await res.json();
      if (res.ok && Array.isArray(data.logs)) setSecurityLogs(data.logs);
    } catch {
      setSecurityLogs([]);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (res.ok) {
        if (typeof data.userId === "string") setCurrentUserId(data.userId);
        if (data.role !== undefined) setUserRole(data.role as MeRole);
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    fetchCredits();
    fetchSavedDocuments();
    fetchApiLogs();
    fetchMe();
  }, [fetchCredits, fetchSavedDocuments, fetchApiLogs, fetchMe]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setSuccessMessage(null);
      if (credits !== null && credits < 1) {
        setError("Insufficient credits. Top up to extract documents.");
        return;
      }
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
          creditsUsed?: number;
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
          if (typeof data.remaining === "number") setCredits(data.remaining);
          fetchSavedDocuments();
          fetchApiLogs();
          const creditsMsg =
            typeof data.creditsUsed === "number" && data.creditsUsed > 0
              ? data.creditsUsed === 1
                ? "Extraction complete. 1 credit used."
                : `Extraction complete. ${data.creditsUsed} credits used.`
              : "Extraction complete.";
          setSuccessMessage(creditsMsg);
          setTimeout(() => setSuccessMessage(null), 5000);
          if (data.saveFailed) {
            const friendly = data.saveError && data.supabaseErrorCode === "PGRST205"
              ? "Saved to this session. To also save to Supabase, create the documents table (see docs/DATABASE.md)."
              : (data.supabaseErrorCode || data.supabaseErrorMessage)
                ? `Saved locally. Database save failed: ${data.supabaseErrorCode ?? ""} ${data.supabaseErrorMessage ?? ""}`.trim()
                : null;
            setError(friendly ?? null);
          } else {
            setError(null);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setIsUploading(false);
      }
    },
    [credits]
  );

  const navItems: { id: DashboardTab; label: string; icon: typeof LayoutGrid }[] = [
    { id: "architect", label: "Architect", icon: LayoutGrid },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "team", label: "Team Management", icon: Users },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="flex flex-col md:flex-row min-h-screen">
        <aside className="md:w-56 md:border-r md:border-white/10 md:bg-petroleum/50 md:sticky md:top-16 md:h-[calc(100vh-4rem)] shrink-0">
          <nav className="p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors w-full whitespace-nowrap ${
                  tab === id
                    ? "bg-teal-accent/20 text-teal-accent"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-8 md:py-12">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">
                {tab === "architect" ? "PDF Architect" : tab === "integrations" ? "Integrations" : "Team Management"}
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {tab === "architect" && "Extract and organize data from any PDF"}
                {tab === "integrations" && "Connect VeloDoc to your stack"}
                {tab === "team" && "Manage your organization"}
              </p>
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

        {tab === "integrations" && (
          <section className="mb-10">
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
              <h2 className="text-lg font-semibold text-white mb-2">Integration Ecosystem</h2>
              <p className="text-slate-400 text-sm mb-8 font-mono text-[10px] uppercase tracking-wider">
                Expanding enterprise ecosystem — join beta for early access.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
                {INTEGRATION_CARDS.map(({ id, name, Icon, description, bento }) => {
                  const joined = waitlistJoined.has(id);
                  const isLarge = bento === "large";
                  const isSmall = bento === "small";
                  return (
                    <div
                      key={id}
                      className={`rounded-2xl border border-white/20 bg-petroleum/40 backdrop-blur-md flex flex-col border-t-teal-accent/30 transition-colors hover:border-teal-accent/40 ${
                        isLarge ? "md:col-span-2 p-6 sm:p-8" : isSmall ? "md:col-span-1 p-5" : "md:col-span-1 p-6"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal-accent/10 flex items-center justify-center mb-4 shrink-0 text-teal-accent">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-white text-sm">{name}</h3>
                      <p className="text-slate-400 text-xs mt-1 flex-1 leading-relaxed">{description}</p>
                      <span className="mt-3 inline-block rounded-full bg-petroleum border border-teal-accent/40 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-teal-accent w-fit">
                        Join Beta
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJoinWaitlist(id)}
                        disabled={joined}
                        className="mt-4 w-full rounded-lg bg-teal-accent/20 hover:bg-teal-accent/30 text-teal-accent border border-teal-accent/40 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors disabled:opacity-70 disabled:pointer-events-none"
                      >
                        {joined ? "You're in" : "Join Beta"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {tab === "team" && (
          <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 sm:p-12 border-t-teal-accent/30">
            <div className="text-center mb-8">
              <Users className="h-14 w-14 text-teal-accent/60 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Project Team</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                Invite team members, assign roles, and manage access. Built for enterprises that need audit trails and SSO.
              </p>
              <Link
                href="/settings/team"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold px-5 py-2.5 transition-colors"
              >
                Open Team Settings
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md p-5 text-left">
                <span className="text-sm font-semibold text-teal-accent">Admin</span>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">Full access to credits, team management, and all uploads.</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md p-5 text-left">
                <span className="text-sm font-semibold text-cyan-400">Editor</span>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">Can upload, edit, and delete their own files.</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md p-5 text-left">
                <span className="text-sm font-semibold text-slate-400">Viewer</span>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">Read-only access to processed data.</p>
              </div>
            </div>
          </section>
        )}

        {tab === "architect" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 sm:p-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Upload & Extract</h2>
                {credits !== null && credits < 1 && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-amber-200 text-sm font-medium">
                      Insufficient credits. Add credits to extract documents.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-semibold transition-colors shrink-0"
                    >
                      Top Up Credits
                    </Link>
                  </div>
                )}
                <UploadZone
                  onFileSelect={handleFileSelect}
                  isUploading={isUploading}
                  disabled={credits !== null && credits < 1}
                />
                {error && (
                  <p className="mt-3 text-sm text-red-300 text-center" role="alert">
                    {error}
                  </p>
                )}
                {successMessage && (
                  <p className="mt-3 text-sm text-teal-accent text-center" role="status">
                    {successMessage}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-6 overflow-hidden">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Usage & Insights</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Credits</span>
                      <span className="text-white font-medium">{stats.creditsUsed}/{stats.creditsTotal}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all"
                        style={{ width: `${Math.min(100, (stats.creditsUsed / stats.creditsTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="text-lg font-bold text-white tabular-nums">{stats.documents}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Documents</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3 flex items-center gap-3">
                      <Layers className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="text-lg font-bold text-white tabular-nums">{stats.lineItems}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Line Items</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="text-lg font-bold text-white tabular-nums">{stats.hoursSaved}h</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Hours Saved</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2 rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-md p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Getting Started</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {GETTING_STARTED_STEPS.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="w-9 h-9 rounded-lg bg-teal-accent/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-teal-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-white text-sm">{title}</h3>
                        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>VeloDoc understands context. No templates required.</span>
                </p>
              </div>
              <div className="rounded-2xl border border-teal-accent/20 bg-teal-accent/5 backdrop-blur-md p-6 flex flex-col justify-center">
                <p className="text-slate-300 text-sm leading-relaxed">
                  <span className="text-teal-accent font-medium">Pro tip:</span> Drop multi-page PDFs—invoices, BOLs, contracts—and get structured data in one go.
                </p>
              </div>
            </div>

            <section className="rounded-2xl mb-6">
              <UsageHistory usage={usage} />
            </section>

            <section className="rounded-2xl mb-6">
              <SecurityLog logs={securityLogs} />
            </section>

            <section className="rounded-2xl">
              <ResultsTable
                documents={documents}
                currentUserId={currentUserId}
                userRole={userRole}
                onDelete={async (id) => {
                  const res = await fetch("/api/documents", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
                  if (res.ok) fetchSavedDocuments();
                }}
                onEdit={async (id, updates) => {
                  const res = await fetch("/api/documents", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
                  if (res.ok) fetchSavedDocuments();
                }}
              />
            </section>
          </>
        )}
        </div>
      </div>
    </main>
  );
}
