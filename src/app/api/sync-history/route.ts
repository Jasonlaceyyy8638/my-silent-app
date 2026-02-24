import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import type { ExtractedRow } from "@/types";

export type SyncedDocumentEntry = {
  id: string;
  file_name: string;
  vendor: string;
  total: string;
  date: string;
  intuit_tid: string | null;
  created_at: string;
  user_id: string;
};

export type FailedSyncEntry = {
  id: string;
  document_id: string | null;
  intuit_tid: string | null;
  error_message: string | null;
  status_code: number;
  created_at: string;
};

/**
 * GET: Sync history for QuickBooks.
 * - Synced documents: rows from documents where qb_sync_status = 'synced'.
 * - Failed syncs: rows from api_logs where endpoint = 'quickbooks/sync' and status_code >= 400.
 * Admins: full org (synced docs + failed syncs by org_id).
 * Editors: only documents they personally uploaded (user_id = userId) and their own failed syncs.
 */
export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ syncedDocuments: [], failedSyncs: [] });
  }

  const isAdmin = orgRole === "org:admin" || orgRole === "admin";

  try {
    let docsQuery = supabase
      .from("documents")
      .select("id, file_name, extracted_data, created_at, intuit_tid, user_id")
      .eq("qb_sync_status", "synced")
      .order("created_at", { ascending: false });

    if (orgId && isAdmin) {
      docsQuery = docsQuery.eq("org_id", orgId);
    } else {
      docsQuery = docsQuery.eq("user_id", userId);
    }

    const { data: docRows, error: docErr } = await docsQuery;

    if (docErr) {
      if (docErr.code === "PGRST205" || /relation|column/i.test(docErr.message ?? "")) {
        return NextResponse.json({ syncedDocuments: [], failedSyncs: [] });
      }
      console.error("[sync-history] documents error:", docErr);
      return NextResponse.json({ syncedDocuments: [], failedSyncs: [] });
    }

    const syncedDocuments: SyncedDocumentEntry[] = (docRows ?? [])
      .filter((r) => r.id && r.extracted_data != null)
      .map((r) => {
        const ext = r.extracted_data as ExtractedRow;
        return {
          id: String(r.id),
          file_name: r.file_name ?? "Document",
          vendor: ext.vendorName ?? "—",
          total: ext.totalAmount ?? "—",
          date: ext.date ?? "—",
          intuit_tid: (r as { intuit_tid?: string | null }).intuit_tid ?? null,
          created_at: r.created_at ?? new Date().toISOString(),
          user_id: (r as { user_id?: string }).user_id ?? userId,
        };
      });

    let logsQuery = supabase
      .from("api_logs")
      .select("id, document_id, intuit_tid, error_message, status_code, created_at, user_id, org_id")
      .eq("endpoint", "quickbooks/sync")
      .gte("status_code", 400)
      .order("created_at", { ascending: false })
      .limit(100);

    if (orgId && isAdmin) {
      logsQuery = logsQuery.eq("org_id", orgId);
    } else {
      logsQuery = logsQuery.eq("user_id", userId);
    }

    const { data: logRows, error: logErr } = await logsQuery;

    if (logErr) {
      if (logErr.code === "PGRST205" || /relation|column/i.test(logErr.message ?? "")) {
        return NextResponse.json({ syncedDocuments, failedSyncs: [] });
      }
      console.error("[sync-history] api_logs error:", logErr);
      return NextResponse.json({ syncedDocuments, failedSyncs: [] });
    }

    const failedSyncs: FailedSyncEntry[] = (logRows ?? []).map((r) => ({
      id: r.id ?? "",
      document_id: (r as { document_id?: string | null }).document_id ?? null,
      intuit_tid: (r as { intuit_tid?: string | null }).intuit_tid ?? null,
      error_message: (r as { error_message?: string | null }).error_message ?? null,
      status_code: typeof r.status_code === "number" ? r.status_code : 0,
      created_at: r.created_at ?? new Date().toISOString(),
    }));

    return NextResponse.json({ syncedDocuments, failedSyncs });
  } catch (err) {
    console.error("[sync-history] error:", err);
    return NextResponse.json({ syncedDocuments: [], failedSyncs: [] });
  }
}
