import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { insertApiLog } from "@/lib/api-log";
import { syncDocumentToQuickBooks } from "@/lib/quickbooks-sync";

/**
 * POST: Sync a document to QuickBooks (create Bill in QBO Production).
 * Allowed for Admin or Editor; Viewers are restricted.
 * Body: { documentId }.
 * On success: returns { ok: true, intuit_tid }.
 * On failure: returns { ok: false, error: string } with 4xx/5xx for client to show teal toast.
 */
export async function POST(request: NextRequest) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  let documentId: string;
  try {
    const body = await request.json();
    documentId = typeof body?.documentId === "string" ? body.documentId.trim() : "";
  } catch {
    documentId = "";
  }
  if (!documentId) {
    return NextResponse.json({ ok: false, error: "documentId required" }, { status: 400 });
  }

  const isAdmin = orgRole === "org:admin" || orgRole === "admin";
  const isEditor = orgRole === "org:member" || orgRole === "member";
  if (orgId && !isAdmin && !isEditor) {
    return NextResponse.json(
      { ok: false, error: "Only Admins and Editors can sync to QuickBooks. Viewers are read-only." },
      { status: 403 }
    );
  }

  const result = await syncDocumentToQuickBooks(documentId, {
    userId,
    orgId,
    orgRole,
    isAdmin,
    isEditor,
  });

  const supabase = getSupabase();
  const logPayload = {
    user_id: userId,
    org_id: orgId ?? null,
    endpoint: "quickbooks/sync",
    status_code: 0,
    credits_consumed: 0,
    document_id: documentId,
  };

  if (result.ok) {
    await insertApiLog(supabase, {
      ...logPayload,
      status_code: 200,
      intuit_tid: result.intuit_tid,
    });
    return NextResponse.json({ ok: true, intuit_tid: result.intuit_tid });
  }

  const status = result.error.includes("permission")
    ? 403
    : result.error.includes("not found") || result.error.includes("not connected")
      ? 404
      : result.error.includes("not configured") || result.error.includes("not set")
        ? 400
        : 502;
  await insertApiLog(supabase, {
    ...logPayload,
    status_code: status,
    error_message: result.error,
  });
  return NextResponse.json({ ok: false, error: result.error }, { status });
}
