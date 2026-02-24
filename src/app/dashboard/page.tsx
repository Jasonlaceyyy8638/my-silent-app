"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileUp,
  Sparkles,
  Download,
  Info,
  FileText,
  Layers,
  Clock,
  History,
  Plug,
  LayoutGrid,
  Users,
  ChevronRight,
  HelpCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useOrganization, useUser } from "@clerk/nextjs";
import { UploadZone } from "@/components/UploadZone";
import { ResultsTable } from "@/components/ResultsTable";
import { DashboardCategorySidebar, type FolderId } from "@/components/DashboardCategorySidebar";
import { UsageHistory, type UsageEntry } from "@/components/UsageHistory";
import { SecurityLog, type SecurityLogEntry } from "@/components/SecurityLog";
import { QuickBooksIcon, ExcelIcon, ZapierIcon, GoogleDriveIcon } from "@/components/integration-icons";
import { identifyDocumentType } from "@/lib/identify-document-type";
import type { ExtractedRow } from "@/types";
import type { DocumentWithRow } from "@/app/api/documents/route";
import type { MeRole, MePlan } from "@/app/api/me/route";
import type { UserTierEntry } from "@/app/api/admin/user-tiers/route";
import type { PlanChangeEntry } from "@/app/api/admin/plan-changes/route";
import { planDisplayName } from "@/lib/plan-display";
import { QuickBooksUpsellModal } from "@/components/QuickBooksUpsellModal";

const CUSTOM_CATEGORIES_KEY = "velodoc_custom_categories";
function getCustomCategoriesStorageKey(orgId: string | null): string {
  return orgId ? `${CUSTOM_CATEGORIES_KEY}_${orgId}` : `${CUSTOM_CATEGORIES_KEY}_personal`;
}
function loadCustomCategories(orgId: string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getCustomCategoriesStorageKey(orgId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveCustomCategories(orgId: string | null, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCustomCategoriesStorageKey(orgId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

type DashboardTab = "architect" | "integrations" | "team";

const TEAM_ADMIN_EMAIL = "admin@velodoc.app";
const TEAM_BILLING_EMAIL = "billing@velodoc.app";

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

function getDocumentCategory(doc: DocumentWithRow): string {
  const cat = doc.extracted_data?.category;
  if (cat) return cat;
  return identifyDocumentType(doc.extracted_data?.documentType);
}

export default function DashboardPage() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const orgId = organization?.id ?? null;
  const userEmail = (user?.primaryEmailAddress?.emailAddress ?? "").trim().toLowerCase();

  const [tab, setTab] = useState<DashboardTab>("architect");
  const [waitlistJoined, setWaitlistJoined] = useState<Set<string>>(new Set());
  const [documents, setDocuments] = useState<DocumentWithRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);
  const [userTiers, setUserTiers] = useState<UserTierEntry[]>([]);
  const [planChanges, setPlanChanges] = useState<PlanChangeEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<MeRole>(null);
  const [plan, setPlan] = useState<MePlan>("starter");
  const [qbUpsellOpen, setQbUpsellOpen] = useState(false);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  const [billingPortalError, setBillingPortalError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);
  const [showLowCreditPopup, setShowLowCreditPopup] = useState(false);
  const lowCreditPopupShownRef = useRef(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderId>("all");
  const [customCategories, setCustomCategories] = useState<string[]>(() => loadCustomCategories(orgId));
  const searchParams = useSearchParams();

  const isPaidPlan = plan === "starter" || plan === "pro" || plan === "enterprise";
  const LOW_CREDIT_THRESHOLD = 5;
  const LOW_CREDIT_SESSION_KEY = "velodoc_low_credit_popup_shown";

  const isPhillipMcKenzie = userRole === "admin" && userEmail === TEAM_ADMIN_EMAIL;
  const isAlissaWilson = userRole === "admin" && userEmail === TEAM_BILLING_EMAIL;

  useEffect(() => {
    setCustomCategories(loadCustomCategories(orgId));
  }, [orgId]);

  const rows = useMemo(() => documents.map((d) => d.extracted_data), [documents]);
  const stats = useUsageStats(rows, credits);

  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    for (const doc of documents) {
      const cat = getDocumentCategory(doc);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    for (const name of customCategories) {
      if (counts[name] == null) counts[name] = 0;
    }
    return counts;
  }, [documents, customCategories]);

  const filteredDocuments = useMemo(() => {
    if (selectedFolder === "all") return documents;
    return documents.filter((d) => getDocumentCategory(d) === selectedFolder);
  }, [documents, selectedFolder]);

  const handleJoinWaitlist = useCallback((id: string) => {
    setWaitlistJoined((prev) => new Set(prev).add(id));
  }, []);

  const handleManageBilling = useCallback(async () => {
    setBillingPortalLoading(true);
    setBillingPortalError(null);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setBillingPortalError(data?.error ?? "Could not open billing portal.");
    } catch {
      setBillingPortalError("Could not open billing portal.");
    } finally {
      setBillingPortalLoading(false);
    }
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
    if (userRole !== "admin") return;
    try {
      const res = await fetch("/api/api-logs");
      const data = await res.json();
      if (res.ok && Array.isArray(data.logs)) setSecurityLogs(data.logs);
    } catch {
      setSecurityLogs([]);
    }
  }, [userRole]);

  const fetchUserTiers = useCallback(async () => {
    if (userRole !== "admin") return;
    try {
      const res = await fetch("/api/admin/user-tiers");
      const data = await res.json();
      if (res.ok && Array.isArray(data.tiers)) setUserTiers(data.tiers);
    } catch {
      setUserTiers([]);
    }
  }, [userRole]);

  const fetchPlanChanges = useCallback(async () => {
    if (userRole !== "admin") return;
    try {
      const res = await fetch("/api/admin/plan-changes?limit=30");
      const data = await res.json();
      if (res.ok && Array.isArray(data.changes)) setPlanChanges(data.changes);
    } catch {
      setPlanChanges([]);
    }
  }, [userRole]);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (res.ok) {
        if (typeof data.userId === "string") setCurrentUserId(data.userId);
        if (data.role !== undefined) setUserRole(data.role as MeRole);
        if (data.plan === "starter" || data.plan === "pro" || data.plan === "enterprise" || data.plan === "free") setPlan(data.plan);
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    fetchCredits();
    fetchSavedDocuments();
    fetchMe();
  }, [fetchCredits, fetchSavedDocuments, fetchMe]);

  // Low Credit warning: once per session, only for paid subscribers when balance < 5
  useEffect(() => {
    if (
      credits !== null &&
      credits < LOW_CREDIT_THRESHOLD &&
      isPaidPlan &&
      !lowCreditPopupShownRef.current &&
      typeof window !== "undefined" &&
      !sessionStorage.getItem(LOW_CREDIT_SESSION_KEY)
    ) {
      lowCreditPopupShownRef.current = true;
      sessionStorage.setItem(LOW_CREDIT_SESSION_KEY, "1");
      setShowLowCreditPopup(true);
    }
  }, [credits, isPaidPlan]);

  useEffect(() => {
    if (userRole === "admin") {
      fetchApiLogs();
      fetchUserTiers();
      fetchPlanChanges();
    }
  }, [userRole, fetchApiLogs, fetchUserTiers, fetchPlanChanges]);

  useEffect(() => {
    if (searchParams.get("sync") === "success") {
      setSyncSuccessToast(true);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard");
      }
      const t = setTimeout(() => setSyncSuccessToast(false), 6000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("qb") === "upgrade") {
      setQbUpsellOpen(true);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard");
      }
    }
  }, [searchParams]);

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
  const SyncHistoryIcon = History;

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
            <Link
              href="/dashboard/sync-history"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full whitespace-nowrap"
            >
              <SyncHistoryIcon className="h-5 w-5 flex-shrink-0" />
              Sync history
            </Link>
            <a
              href="mailto:support@velodoc.app?subject=Dashboard%20Help"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full whitespace-nowrap"
              title="Sharon Ferguson — support@velodoc.app"
            >
              <HelpCircle className="h-5 w-5 flex-shrink-0" aria-hidden />
              Help
            </a>
            <a
              href="mailto:support@velodoc.app?subject=Credit%20Top-up"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full whitespace-nowrap"
              title="Credit Top-ups — Sharon Ferguson, support@velodoc.app"
            >
              Credit Top-ups
            </a>
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
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex rounded-full bg-teal-accent/20 border border-teal-accent/40 px-2.5 py-0.5 text-xs font-medium text-teal-accent" aria-label="Current plan">
                  Plan: {planDisplayName(plan)}
                </span>
                {credits !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                    Credit balance: <span className="font-semibold text-teal-accent tabular-nums">{credits}</span>
                    <button
                      type="button"
                      onClick={() => fetchCredits()}
                      className="text-slate-500 hover:text-teal-accent text-xs underline"
                      aria-label="Refresh credit balance"
                    >
                      Refresh
                    </button>
                  </span>
                )}
              </div>
            </div>
            {credits !== null && (plan === "starter" || plan === "pro" || plan === "enterprise") && credits < 1 && (
              <p className="text-slate-300 text-sm flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2" role="status">
                Infrastructure Active. Please add credits to resume processing.
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
                  const isQuickBooks = id === "quickbooks";
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm">{name}</h3>
                        {isQuickBooks && (
                          <span className="rounded-full bg-[#22d3ee]/20 border border-[#22d3ee]/40 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#22d3ee]">
                            Pro Feature
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-1 flex-1 leading-relaxed">{description}</p>
                      {isQuickBooks ? (
                        <>
                          <span className="mt-3 inline-block rounded-full bg-lime-500/20 border border-lime-400/40 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-lime-300 w-fit">
                            Active
                          </span>
                          {/* QuickBooks Sync button hidden unless plan_type is Professional or Enterprise */}
                          {(plan === "pro" || plan === "enterprise") ? (
                            <Link
                              href="/api/quickbooks/auth"
                              className="mt-4 w-full rounded-lg bg-teal-accent/20 hover:bg-teal-accent/30 text-teal-accent border border-teal-accent/40 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-center transition-colors"
                            >
                              Connect
                            </Link>
                          ) : (
                            <div className="mt-4 space-y-2">
                              <p className="text-slate-500 text-xs">Upgrade to Professional or Enterprise to connect QuickBooks.</p>
                              <button
                                type="button"
                                onClick={() => setQbUpsellOpen(true)}
                                className="w-full rounded-lg bg-teal-accent/20 hover:bg-teal-accent/30 text-teal-accent border border-teal-accent/40 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors"
                              >
                                Upgrade
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 backdrop-blur-md p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t-[#22d3ee]/30">
                <div>
                  <h3 className="font-semibold text-white text-sm">Weekly Report</h3>
                  <p className="text-slate-400 text-xs mt-1">Every Monday at 8:00 AM — CSV architectural log of your nationwide sync history to your inbox.</p>
                </div>
                <span className="shrink-0 inline-flex rounded-full bg-lime-500/20 border border-lime-400/40 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-lime-300">
                  Active
                </span>
              </div>
              {qbUpsellOpen && (
                <QuickBooksUpsellModal onClose={() => setQbUpsellOpen(false)} />
              )}
            </div>
          </section>
        )}

        {tab === "team" && (
          <>
            {isPhillipMcKenzie && (
              <section className="mb-8 rounded-2xl border border-[#22d3ee]/30 bg-[#22d3ee]/5 backdrop-blur-xl p-6 sm:p-8 border-t-[#22d3ee]/40">
                <h2 className="text-lg font-semibold text-white mb-2">Weekly Sync Report</h2>
                <p className="text-slate-400 text-sm mb-4">
                  The weekly architectural sync report runs every Monday at 8:00 AM and is sent to admin@velodoc.app. The CSV includes all documents synced to QuickBooks in the last 7 days.
                </p>
                <Link
                  href="/dashboard/sync-history"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] border border-[#22d3ee]/40 px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <History className="h-4 w-4" aria-hidden />
                  View Sync History
                </Link>
              </section>
            )}
            {userRole === "admin" && (
              <section className="mb-8 rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 backdrop-blur-xl p-6 sm:p-8 border-t-[#22d3ee]/30">
                <h2 className="text-lg font-semibold text-white mb-2">User Tiers (Master Admin View)</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Which tier each user is on. Phillip McKenzie can use this to see Starter, Professional, and Enterprise assignments.
                </p>
                {userTiers.length === 0 ? (
                  <p className="text-slate-500 text-sm">No profile data yet, or table not loaded.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-petroleum/40">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-slate-400 font-medium">Email / User</th>
                          <th className="px-4 py-3 text-slate-400 font-medium">Tier</th>
                          <th className="px-4 py-3 text-slate-400 font-medium">Provider</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTiers.map((entry) => (
                          <tr key={entry.user_id} className="border-b border-white/5 last:border-0">
                            <td className="px-4 py-2.5 text-white font-mono truncate max-w-[240px]" title={entry.user_id}>
                              {entry.email ?? `${entry.user_id.slice(0, 12)}…`}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex rounded-full bg-teal-accent/20 border border-teal-accent/40 px-2.5 py-0.5 text-xs font-medium text-teal-accent">
                                {planDisplayName(entry.plan_type)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-300">
                              {entry.auth_provider ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
            {userRole === "admin" && (
              <section className="mb-8 rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 backdrop-blur-xl p-6 sm:p-8 border-t-[#22d3ee]/30">
                <h2 className="text-lg font-semibold text-white mb-2">Recent plan changes (Pro / Enterprise)</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Logged when a user upgrades to Pro or Enterprise so Phillip McKenzie can see new signups in his admin view.
                </p>
                {planChanges.length === 0 ? (
                  <p className="text-slate-500 text-sm">No plan changes yet, or table not loaded.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-petroleum/40">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-slate-400 font-medium">Date</th>
                          <th className="px-4 py-3 text-slate-400 font-medium">Email / User</th>
                          <th className="px-4 py-3 text-slate-400 font-medium">From → To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planChanges.map((entry) => (
                          <tr key={entry.id} className="border-b border-white/5 last:border-0">
                            <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                              {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-white font-mono truncate max-w-[200px]" title={entry.user_id}>
                              {entry.customer_email ?? `${entry.user_id.slice(0, 10)}…`}
                            </td>
                            <td className="px-4 py-2.5 text-slate-300">
                              {(entry.from_plan ? planDisplayName(entry.from_plan) : "—")} → <span className="text-teal-accent font-medium">{planDisplayName(entry.to_plan)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
            {isAlissaWilson && (
              <section className="mb-8 rounded-2xl border border-[#22d3ee]/30 bg-[#22d3ee]/5 backdrop-blur-xl p-6 sm:p-8 border-t-[#22d3ee]/40">
                <h2 className="text-lg font-semibold text-white mb-2">Subscription Revenue</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Revenue from Starter and Pro subscriptions. Data is synced from Stripe.
                </p>
                <div className="rounded-xl border border-white/20 bg-white/5 p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <p className="text-slate-400 text-sm text-center">Revenue charts will appear here once connected to your Stripe dashboard.</p>
                  <a
                    href="mailto:billing@velodoc.app?subject=Stripe%20revenue%20data"
                    className="mt-4 text-[#22d3ee] text-sm font-medium hover:underline"
                    title="Alissa Wilson — billing@velodoc.app"
                  >
                    Contact Billing
                  </a>
                </div>
              </section>
            )}
            <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 sm:p-12 border-t-teal-accent/30">
              <div className="text-center mb-8">
                <Users className="h-14 w-14 text-teal-accent/60 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Project Team</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  Invite team members, assign roles, and manage access. Built for enterprises that need audit trails and SSO.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/settings/team"
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold px-5 py-2.5 transition-colors"
                  >
                    Open Team Settings
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleManageBilling}
                    disabled={billingPortalLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-accent/20 hover:bg-teal-accent/30 text-teal-accent border border-teal-accent/40 px-5 py-2.5 font-semibold transition-colors disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {billingPortalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Opening…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" aria-hidden />
                        Manage Billing & Subscription
                      </>
                    )}
                  </button>
                </div>
                {billingPortalError && (
                  <p className="mt-4 text-sm text-red-300 text-center" role="alert">
                    {billingPortalError}
                  </p>
                )}
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
            {userRole === "admin" && (
              <section className="mt-8 rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 backdrop-blur-xl p-6 sm:p-8 border-t-[#22d3ee]/30 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
                <h2 className="text-lg font-semibold text-white mb-1">Institutional Management</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Nationwide branding: create custom categories for your business. They appear as folders in the Architect sidebar.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Category name (e.g. Healthcare, HR)"
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#22d3ee] focus:outline-none focus:ring-1 focus:ring-[#22d3ee] min-w-[180px]"
                    id="custom-category-input"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const input = e.currentTarget;
                      const name = input.value?.trim();
                      if (!name || customCategories.includes(name)) return;
                      const next = [...customCategories, name];
                      setCustomCategories(next);
                      saveCustomCategories(orgId, next);
                      input.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("custom-category-input") as HTMLInputElement | null;
                      const name = input?.value?.trim();
                      if (!name || customCategories.includes(name)) return;
                      const next = [...customCategories, name];
                      setCustomCategories(next);
                      saveCustomCategories(orgId, next);
                      if (input) input.value = "";
                    }}
                    className="rounded-lg bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] border border-[#22d3ee]/40 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Add category
                  </button>
                </div>
                {customCategories.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {customCategories.map((name) => (
                      <li
                        key={name}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/10 px-3 py-1.5 text-sm text-white"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => {
                            const next = customCategories.filter((c) => c !== name);
                            setCustomCategories(next);
                            saveCustomCategories(orgId, next);
                          }}
                          className="rounded p-0.5 text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                          aria-label={`Remove ${name}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm">No custom categories yet. Add one to show it in the Architect sidebar.</p>
                )}
              </section>
            )}
          </>
        )}

        {tab === "architect" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 sm:p-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Upload & Extract</h2>
                {credits !== null && credits < 1 && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-amber-200 text-sm font-medium">
                      {(plan === "starter" || plan === "pro" || plan === "enterprise")
                        ? "Infrastructure Active. Please add credits to resume processing."
                        : "Insufficient credits. Add credits to extract documents."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-semibold transition-colors"
                      >
                        Top Up Credits
                      </Link>
                      <a
                        href="mailto:billing@velodoc.app?subject=Billing%20inquiry"
                        className="inline-flex items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 text-white px-4 py-2.5 text-sm font-medium transition-colors"
                        title="Alissa Wilson — billing@velodoc.app"
                      >
                        Contact Billing
                      </a>
                    </div>
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

            {userRole === "admin" && (
              <section className="rounded-2xl mb-6">
                <SecurityLog logs={securityLogs} />
              </section>
            )}

            {syncError && (
              <div
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md rounded-xl border-2 border-[#22d3ee]/60 bg-[#0f172a]/95 backdrop-blur-xl px-4 py-3 shadow-[0_0_24px_rgba(34,211,238,0.25)] text-[#22d3ee] text-sm flex items-center justify-between gap-4"
                role="alert"
              >
                <span className="flex-1">{syncError}</span>
                <button
                  type="button"
                  onClick={() => setSyncError(null)}
                  className="shrink-0 rounded-lg border border-[#22d3ee]/40 px-2 py-1 text-xs font-medium hover:bg-[#22d3ee]/10 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {syncSuccessToast && (
              <div
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md rounded-xl border-2 border-[#22d3ee]/60 bg-[#0f172a]/95 backdrop-blur-xl px-4 py-3 shadow-[0_0_24px_rgba(34,211,238,0.4)] text-[#22d3ee] text-sm font-medium"
                role="status"
                aria-live="polite"
              >
                VeloDoc is now architecting your QuickBooks data
              </div>
            )}

            {showLowCreditPopup && credits !== null && isPaidPlan && credits < LOW_CREDIT_THRESHOLD && (
              <div
                className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-4 rounded-2xl border border-amber-500/40 bg-slate-900/98 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.5)] border-t-teal-accent/30"
                role="alert"
                aria-live="polite"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-200">
                        Low Balance
                      </h3>
                      <p className="mt-2 text-slate-300 text-sm leading-relaxed">
                        You have {credits} extraction{credits === 1 ? "" : "s"} remaining. Add credits to avoid service interruption.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLowCreditPopup(false)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center rounded-xl bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold px-4 py-2.5 text-sm transition-colors"
                    >
                      Purchase Credits
                    </Link>
                    {plan === "enterprise" && credits === 0 && (
                      <a
                        href="mailto:support@velodoc.app?subject=Bulk%20credit%20top-up%20(Enterprise)"
                        className="inline-flex items-center justify-center rounded-xl border border-white/20 hover:bg-white/10 text-slate-200 font-medium px-4 py-2.5 text-sm transition-colors"
                        title="Sharon Ferguson — support@velodoc.app"
                      >
                        Contact Support
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <section className="rounded-2xl flex flex-col sm:flex-row gap-6 items-start">
              <DashboardCategorySidebar
                selectedId={selectedFolder}
                onSelect={setSelectedFolder}
                customCategories={customCategories}
                documentCounts={documentCounts}
              />
              <div className="flex-1 min-w-0 w-full">
                <ResultsTable
                  documents={filteredDocuments}
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
                  onSyncSuccess={fetchSavedDocuments}
                  onSyncError={(message) => {
                    setSyncError(message);
                    setTimeout(() => setSyncError(null), 8000);
                  }}
                  onSyncStart={() => setSyncError(null)}
                  selectedFolder={selectedFolder}
                />
              </div>
            </section>
          </>
        )}
        </div>
      </div>
    </main>
  );
}
