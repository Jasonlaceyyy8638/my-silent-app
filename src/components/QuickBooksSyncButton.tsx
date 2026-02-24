"use client";

import { useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import type { MeRole } from "@/app/api/me/route";

const SESSION_KEY_PREFIX = "velodoc_qb_tid_";

type QuickBooksSyncButtonProps = {
  documentId: string;
  qb_sync_status?: string | null;
  intuit_tid?: string | null;
  userRole: MeRole;
  onSyncSuccess?: () => void;
  onSyncError?: (message: string) => void;
  onSyncStart?: () => void;
};

function getSessionTid(documentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${documentId}`);
  } catch {
    return null;
  }
}

function setSessionTid(documentId: string, intuit_tid: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${documentId}`, intuit_tid);
  } catch {
    // ignore
  }
}

export function QuickBooksSyncButton({
  documentId,
  qb_sync_status,
  intuit_tid,
  userRole,
  onSyncSuccess,
  onSyncError,
  onSyncStart,
}: QuickBooksSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localSynced, setLocalSynced] = useState(false);
  const [localTid, setLocalTid] = useState<string | null>(() => getSessionTid(documentId));

  const isViewer = userRole === "viewer";
  const isSynced = qb_sync_status === "synced" || localSynced;
  const displayTid = intuit_tid ?? localTid;

  const handleSync = async () => {
    if (isLoading || isSynced) return;
    onSyncStart?.();
    setIsLoading(true);
    try {
      const res = await fetch("/api/quickbooks/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok === true) {
        const tid = data.intuit_tid ?? "";
        setLocalSynced(true);
        setLocalTid(tid || null);
        if (tid) setSessionTid(documentId, tid);
        onSyncSuccess?.();
      } else {
        const message = typeof data?.error === "string" ? data.error : "Sync to QuickBooks failed.";
        onSyncError?.(message);
      }
    } catch {
      onSyncError?.("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isViewer) {
    return (
      <span
        className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-slate-400"
        title="Viewers have read-only access"
      >
        Read-only
      </span>
    );
  }

  if (isSynced) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#22d3ee]/50 bg-[#22d3ee]/10 backdrop-blur-sm px-2.5 py-1.5 text-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.4)]"
        title={displayTid ? `Synced (Bill Id: ${displayTid})` : "Synced to QuickBooks"}
      >
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-xs font-medium">Synced</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#22d3ee]/50 bg-[#22d3ee]/10 backdrop-blur-sm px-2.5 py-1.5 text-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all hover:bg-[#22d3ee]/20 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)] disabled:opacity-70 disabled:pointer-events-none"
      aria-label="Sync to QuickBooks"
    >
      <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
      <span className="text-xs font-medium">{isLoading ? "Syncing…" : "Sync to QB"}</span>
    </button>
  );
}
