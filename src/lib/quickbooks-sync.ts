/**
 * Server-side QuickBooks sync: fetch document + profile tokens, format Bill, POST to QBO Production API.
 * On success: update document qb_sync_status and intuit_tid.
 * On failure: throw with message for client toast.
 */
import { getSupabase } from "@/lib/supabase";
import type { ExtractedRow } from "@/types";

const QBO_BASE = "https://quickbooks.api.intuit.com/v3/company";

export type SyncDocumentToQuickBooksContext = {
  userId: string;
  orgId: string | null;
  orgRole: string | null;
  isAdmin: boolean;
  isEditor: boolean;
};

export type SyncDocumentToQuickBooksResult = {
  ok: true;
  intuit_tid: string;
} | {
  ok: false;
  error: string;
};

function parseAmount(s: string): number {
  const cleaned = String(s ?? "0").replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatTxnDate(dateStr: string): string {
  const s = String(dateStr ?? "").trim();
  if (!s) return new Date().toISOString().slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/**
 * Find or create a Vendor by DisplayName; return Vendor Id.
 */
async function getOrCreateVendorId(
  accessToken: string,
  realmId: string,
  displayName: string
): Promise<string> {
  const name = (displayName || "Unknown Vendor").slice(0, 200);
  const query = `select * from Vendor where DisplayName = '${name.replace(/'/g, "''")}' maxresults 1`;
  const qRes = await fetch(
    `${QBO_BASE}/${realmId}/query?query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!qRes.ok) {
    const errText = await qRes.text();
    throw new Error(`QuickBooks Vendor lookup failed: ${errText.slice(0, 200)}`);
  }
  const qData = (await qRes.json()) as { QueryResponse?: { Vendor?: { Id: string }[] } };
  const vendors = qData.QueryResponse?.Vendor ?? [];
  if (vendors.length > 0 && vendors[0].Id) return vendors[0].Id;

  const createRes = await fetch(`${QBO_BASE}/${realmId}/vendor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ DisplayName: name }),
  });
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`QuickBooks create Vendor failed: ${errText.slice(0, 200)}`);
  }
  const createJson = (await createRes.json()) as { Vendor?: { Id?: string } };
  const id = createJson.Vendor?.Id;
  if (!id) throw new Error("QuickBooks Vendor created but no Id returned");
  return id;
}

/**
 * Create a Bill in QuickBooks Production and return the Bill Id (intuit_tid).
 */
export async function syncDocumentToQuickBooks(
  documentId: string,
  context: SyncDocumentToQuickBooksContext
): Promise<SyncDocumentToQuickBooksResult> {
  const { userId, orgId, orgRole, isAdmin, isEditor } = context;

  if (orgId && !isAdmin && !isEditor) {
    return { ok: false, error: "Only Admins and Editors can sync to QuickBooks." };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Service unavailable." };
  }

  const profileRes = await supabase
    .from("profiles")
    .select("qb_access_token, qb_realm_id")
    .eq("user_id", userId)
    .maybeSingle();

  const profile = profileRes.data as { qb_access_token?: string; qb_realm_id?: string } | null;
  const accessToken = profile?.qb_access_token?.trim();
  const realmId = (profile?.qb_realm_id ?? process.env.QB_REALM_ID ?? "").trim();

  if (!accessToken) {
    return { ok: false, error: "QuickBooks not connected. Connect your account in settings." };
  }
  if (!realmId) {
    return { ok: false, error: "QuickBooks company (realm) not set. Reconnect QuickBooks." };
  }

  let docQuery = supabase
    .from("documents")
    .select("id, user_id, org_id, extracted_data")
    .eq("id", documentId)
    .maybeSingle();

  const { data: docRow, error: docErr } = await docQuery;
  if (docErr || !docRow) {
    return { ok: false, error: "Document not found." };
  }

  const docUserId = (docRow as { user_id?: string }).user_id;
  const docOrgId = (docRow as { org_id?: string | null }).org_id ?? null;
  const canSyncAsOrg = (isAdmin || isEditor) && orgId && docOrgId === orgId;
  const canSyncOwn = docUserId === userId;
  if (!canSyncAsOrg && !canSyncOwn) {
    return { ok: false, error: "You do not have permission to sync this document." };
  }

  const extracted = (docRow as { extracted_data?: unknown }).extracted_data as ExtractedRow | undefined;
  if (!extracted || typeof extracted !== "object") {
    return { ok: false, error: "Document has no extracted data to sync." };
  }

  const vendorName = String(extracted.vendorName ?? "").trim() || "Vendor";
  const totalAmount = parseAmount(extracted.totalAmount);
  const txnDate = formatTxnDate(extracted.date);
  const expenseAccountId = process.env.QB_EXPENSE_ACCOUNT_ID?.trim();
  if (!expenseAccountId) {
    return { ok: false, error: "QuickBooks expense account not configured (QB_EXPENSE_ACCOUNT_ID)." };
  }

  let vendorId: string;
  try {
    vendorId = await getOrCreateVendorId(accessToken, realmId, vendorName);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }

  const category = extracted.documentType ?? "Bill";
  const billBody = {
    VendorRef: { value: vendorId },
    TxnDate: txnDate,
    Line: [
      {
        Amount: totalAmount,
        DetailType: "AccountBasedExpenseDetail",
        AccountBasedExpenseDetail: {
          AccountRef: { value: expenseAccountId },
        },
        Description: category,
      },
    ],
  };

  const billRes = await fetch(`${QBO_BASE}/${realmId}/bill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(billBody),
  });

  const billText = await billRes.text();
  if (!billRes.ok) {
    let errMsg = `QuickBooks error (${billRes.status})`;
    try {
      const j = JSON.parse(billText) as { Fault?: { Error?: { Message?: string }[] } };
      const msg = j.Fault?.Error?.[0]?.Message;
      if (msg) errMsg = msg;
    } catch {
      if (billText.length < 300) errMsg = billText || errMsg;
    }
    return { ok: false, error: errMsg };
  }

  let billId: string;
  try {
    const billJson = JSON.parse(billText) as { Bill?: { Id?: string } };
    billId = billJson.Bill?.Id ?? "";
  } catch {
    return { ok: false, error: "QuickBooks returned success but invalid response." };
  }
  if (!billId) {
    return { ok: false, error: "QuickBooks did not return a Bill Id." };
  }

  const nowIso = new Date().toISOString();
  let updateQuery = supabase
    .from("documents")
    .update({ qb_sync_status: "synced", intuit_tid: billId, updated_at: nowIso })
    .eq("id", documentId);
  if (canSyncAsOrg && orgId) {
    updateQuery = updateQuery.eq("org_id", orgId);
  } else {
    updateQuery = updateQuery.eq("user_id", userId);
  }

  const { error: updateErr } = await updateQuery;
  if (updateErr) {
    console.error("[quickbooks-sync] document update error:", updateErr);
    return { ok: false, error: "Bill created in QuickBooks but failed to save sync status." };
  }

  return { ok: true, intuit_tid: billId };
}
