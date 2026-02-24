import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import type { ExtractedRow } from "@/types";

export type DocumentWithRow = {
  id: string;
  file_name: string;
  extracted_data: ExtractedRow;
  created_at: string;
  page_count?: number;
  credit_cost?: number;
  /** Uploader's user id (for role-based delete: Editors can only delete own uploads). */
  user_id: string;
  /** QuickBooks sync state: 'synced' when pushed to QB; otherwise absent or pending. */
  qb_sync_status?: string | null;
  /** QuickBooks Bill Id after successful sync. */
  intuit_tid?: string | null;
};

/**
 * GET: return saved extractions for the current user or organization.
 * In org context: returns all docs in the org (for Editors/Admins). Includes user_id (uploader) per doc.
 */
export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ documents: [], usage: [] });
  }

  try {
    let query = supabase
      .from("documents")
      .select("id, user_id, extracted_data, file_name, created_at, page_count, credit_cost, org_id, qb_sync_status, intuit_tid")
      .order("created_at", { ascending: false });

    if (orgId && String(orgId).trim()) {
      query = query.eq("org_id", orgId);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205") {
        return NextResponse.json({ documents: [], usage: [] });
      }
      if ((error.message ?? "").includes("org_id") || (error.message ?? "").includes("column")) {
        const fallback = await supabase
          .from("documents")
          .select("id, user_id, extracted_data, file_name, created_at, page_count, credit_cost, qb_sync_status, intuit_tid")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (!fallback.error && fallback.data) {
          const raw = fallback.data ?? [];
          const documents: DocumentWithRow[] = raw
            .filter((r) => r.id && r.extracted_data != null && typeof r.extracted_data === "object")
            .map((r) => ({
              id: String(r.id),
              file_name: r.file_name ?? "Document",
              extracted_data: r.extracted_data as ExtractedRow,
              created_at: r.created_at ?? new Date().toISOString(),
              page_count: r.page_count,
              credit_cost: r.credit_cost,
              user_id: (r as { user_id?: string }).user_id ?? userId,
              qb_sync_status: (r as { qb_sync_status?: string | null }).qb_sync_status ?? null,
              intuit_tid: (r as { intuit_tid?: string | null }).intuit_tid ?? null,
            }));
          const usage = raw.map((r) => ({
            file_name: r.file_name ?? "Document",
            date_processed: r.created_at ?? new Date().toISOString(),
            credits_used: typeof r.credit_cost === "number" ? r.credit_cost : 1,
          }));
          return NextResponse.json({ documents, usage });
        }
      }
      console.error("[documents] list error:", error);
      return NextResponse.json({ documents: [], usage: [] });
    }

    const raw = data ?? [];
    const documents: DocumentWithRow[] = raw
      .filter((r) => r.id && r.extracted_data != null && typeof r.extracted_data === "object")
      .map((r) => ({
        id: String(r.id),
        file_name: r.file_name ?? "Document",
        extracted_data: r.extracted_data as ExtractedRow,
        created_at: r.created_at ?? new Date().toISOString(),
        page_count: r.page_count,
        credit_cost: r.credit_cost,
        user_id: (r as { user_id?: string }).user_id ?? userId,
        qb_sync_status: (r as { qb_sync_status?: string | null }).qb_sync_status ?? null,
        intuit_tid: (r as { intuit_tid?: string | null }).intuit_tid ?? null,
      }));

    const usage = raw.map((r) => ({
      file_name: r.file_name ?? "Document",
      date_processed: r.created_at ?? new Date().toISOString(),
      credits_used: typeof r.credit_cost === "number" ? r.credit_cost : 1,
    }));

    return NextResponse.json({ documents, usage });
  } catch (err) {
    console.error("[documents] error:", err);
    return NextResponse.json({ documents: [], usage: [] });
  }
}

/**
 * DELETE: Admin can delete any doc in the org; Editor only their own uploads.
 */
export async function DELETE(request: NextRequest) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Documents not available" }, { status: 503 });
  }

  let id: string;
  try {
    const body = await request.json();
    id = typeof body?.id === "string" ? body.id.trim() : "";
  } catch {
    id = "";
  }
  if (!id) {
    return NextResponse.json({ error: "Document id required" }, { status: 400 });
  }

  const { data: doc, error: fetchErr } = await supabase
    .from("documents")
    .select("id, user_id, org_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const docUserId = (doc as { user_id?: string }).user_id;
  const docOrgId = (doc as { org_id?: string | null }).org_id ?? null;
  const isAdmin = orgRole === "org:admin" || orgRole === "admin";
  const canDeleteAsAdmin = isAdmin && orgId && docOrgId === orgId;
  const canDeleteOwn = docUserId === userId;

  if (!canDeleteAsAdmin && !canDeleteOwn) {
    return NextResponse.json({ error: "You can only delete your own uploads" }, { status: 403 });
  }

  let deleteQuery = supabase.from("documents").delete().eq("id", id);
  if (canDeleteAsAdmin) {
    deleteQuery = deleteQuery.eq("org_id", orgId);
  } else {
    deleteQuery = deleteQuery.eq("user_id", userId);
  }

  const { error } = await deleteQuery;
  if (error) {
    console.error("[documents] delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/**
 * PATCH: Admin and Editor can edit any doc in the org; otherwise user must own the doc.
 */
export async function PATCH(request: NextRequest) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Documents not available" }, { status: 503 });
  }

  let id: string;
  let file_name: string | undefined;
  let extracted_data: ExtractedRow | undefined;
  try {
    const body = await request.json();
    id = typeof body?.id === "string" ? body.id.trim() : "";
    if (typeof body?.file_name === "string") file_name = body.file_name.trim();
    if (body?.extracted_data != null && typeof body.extracted_data === "object")
      extracted_data = body.extracted_data as ExtractedRow;
  } catch {
    id = "";
  }
  if (!id) {
    return NextResponse.json({ error: "Document id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (file_name !== undefined) updates.file_name = file_name;
  if (extracted_data !== undefined) updates.extracted_data = extracted_data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data: doc, error: fetchErr } = await supabase
    .from("documents")
    .select("id, user_id, org_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const docUserId = (doc as { user_id?: string }).user_id;
  const docOrgId = (doc as { org_id?: string | null }).org_id ?? null;
  const isAdmin = orgRole === "org:admin" || orgRole === "admin";
  const isEditor = orgRole === "org:member" || orgRole === "member";
  const canEditAsOrgRole = (isAdmin || isEditor) && orgId && docOrgId === orgId;
  const canEditOwn = docUserId === userId;

  if (!canEditAsOrgRole && !canEditOwn) {
    return NextResponse.json({ error: "You do not have permission to edit this document" }, { status: 403 });
  }

  let updateQuery = supabase.from("documents").update(updates).eq("id", id);
  if (canEditAsOrgRole) {
    updateQuery = updateQuery.eq("org_id", orgId);
  } else {
    updateQuery = updateQuery.eq("user_id", userId);
  }

  const { error } = await updateQuery;
  if (error) {
    console.error("[documents] patch error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
