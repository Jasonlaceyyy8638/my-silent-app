"use client";

import { useState } from "react";
import { FileSpreadsheet, MessageSquare, RefreshCw, X } from "lucide-react";
import { QuickBooksIcon } from "@/components/integration-icons";

type SyncDestination = "quickbooks" | "sheets" | "slack";

type SyncDestinationModalProps = {
  documentId: string;
  onClose: () => void;
  onPushToQuickBooks: (documentId: string) => Promise<void>;
  onSyncError?: (message: string) => void;
  onSyncStart?: () => void;
};

export function SyncDestinationModal({
  documentId,
  onClose,
  onPushToQuickBooks,
  onSyncError,
  onSyncStart,
}: SyncDestinationModalProps) {
  const [loading, setLoading] = useState<SyncDestination | null>(null);

  const handleQuickBooks = async () => {
    setLoading("quickbooks");
    onSyncStart?.();
    try {
      await onPushToQuickBooks(documentId);
      onClose();
    } catch {
      onSyncError?.("Sync failed.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      <div className="rounded-2xl border border-white/20 bg-[#0f172a]/95 backdrop-blur-xl p-6 w-full max-w-md border-t-[#22d3ee]/30 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
        <div className="flex items-center justify-between mb-4">
          <h3 id="sync-modal-title" className="text-lg font-semibold text-white">
            International Bridge
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-1">
          Your data, any time zone and format—Absolute Precision from document to destination.
        </p>
        <p className="text-slate-500 text-xs mb-5">
          Push extracted data to the right place for your workflow.
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleQuickBooks}
            disabled={loading !== null}
            className="w-full flex items-center gap-4 rounded-xl border border-[#22d3ee]/40 bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 text-left p-4 transition-colors disabled:opacity-70"
          >
            <div className="w-10 h-10 rounded-lg bg-[#22d3ee]/20 flex items-center justify-center shrink-0">
              <QuickBooksIcon className="w-5 h-5 text-[#22d3ee]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-white block">Push to QuickBooks</span>
              <span className="text-xs text-slate-400">For financial files — create Bills and sync to your books.</span>
            </div>
            {loading === "quickbooks" ? (
              <RefreshCw className="h-5 w-5 text-[#22d3ee] animate-spin shrink-0" />
            ) : null}
          </button>

          <button
            type="button"
            disabled
            className="w-full flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 text-left p-4 opacity-75 cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-300 block">Export to Sheets</span>
              <span className="text-xs text-slate-500">For logs and tabular data — coming soon.</span>
            </div>
          </button>

          <button
            type="button"
            disabled
            className="w-full flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 text-left p-4 opacity-75 cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-300 block">Notify Slack</span>
              <span className="text-xs text-slate-500">For alerts and team notifications — coming soon.</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
