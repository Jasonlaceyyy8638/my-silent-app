import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getEmailSignature } from "@/lib/email-signature";
import type { ExtractedRow } from "@/types";

const FROM_EMAIL = process.env.WEEKLY_REPORT_FROM_EMAIL ?? process.env.FROM_EMAIL ?? "Phillip McKenzie <admin@velodoc.app>";
const ARCHITECTURAL_LOGS_URL = "https://velodoc.app/dashboard/sync-history";

type DocRow = {
  id?: string;
  file_name?: string | null;
  extracted_data?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  intuit_tid?: string | null;
};

/**
 * GET (or POST) /api/cron/weekly-report
 *
 * Generates a CSV of all documents where qb_sync_status = 'synced' and
 * updated_at (or created_at) is within the last 7 days, then emails it to
 * the Admin's email (from profiles or WEEKLY_REPORT_EMAIL).
 *
 * Security: Only the automated scheduler may trigger this. Require
 * Authorization: Bearer <CRON_SECRET> or x-cron-secret: <CRON_SECRET>.
 */
export async function GET(request: Request) {
  return runWeeklyReport(request);
}

export async function POST(request: Request) {
  return runWeeklyReport(request);
}

function getCronSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-cron-secret")?.trim() ?? null;
}

function escapeCsvCell(value: string): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function runWeeklyReport(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const provided = getCronSecret(request);

  if (!secret || !provided || secret !== provided) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  let rows: DocRow[] = [];
  let query = supabase
    .from("documents")
    .select("id, file_name, extracted_data, created_at, updated_at, intuit_tid, user_id, org_id")
    .eq("qb_sync_status", "synced")
    .gte("updated_at", sevenDaysAgoIso)
    .order("created_at", { ascending: false });

  const { data: dataWithUpdated, error: errUpdated } = await query;

  if (errUpdated) {
    if ((errUpdated.message ?? "").includes("updated_at") || (errUpdated.message ?? "").includes("column")) {
      const fallback = await supabase
        .from("documents")
        .select("id, file_name, extracted_data, created_at, intuit_tid, user_id, org_id")
        .eq("qb_sync_status", "synced")
        .gte("created_at", sevenDaysAgoIso)
        .order("created_at", { ascending: false });
      if (fallback.error) {
        console.error("[weekly-report] documents error:", fallback.error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
      }
      rows = (fallback.data ?? []) as DocRow[];
    } else {
      console.error("[weekly-report] documents error:", errUpdated);
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
  } else {
    rows = (dataWithUpdated ?? []) as DocRow[];
  }

  return await buildAndSendReport(rows, supabase, request);
}

type PaymentRow = { plan?: string; amount_total_cents?: number; customer_email?: string | null; created_at?: string | null };

async function buildAndSendReport(
  rows: DocRow[],
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabase>>>,
  _request: Request
): Promise<NextResponse> {
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let paymentRows: PaymentRow[] = [];
  try {
    const { data } = await supabase
      .from("stripe_payments")
      .select("plan, amount_total_cents, customer_email, created_at")
      .gte("created_at", sevenDaysAgoIso)
      .order("created_at", { ascending: false });
    paymentRows = (data ?? []) as PaymentRow[];
  } catch {
    // Table may not exist yet; report continues without payments section.
  }

  const header = ["File", "Vendor", "Total", "Date", "Bill Id", "Document Id", "Synced / Updated at"];
  const body = rows
    .filter((r) => r.id && r.extracted_data != null)
    .map((r) => {
      const ext = (r.extracted_data ?? {}) as ExtractedRow;
      const syncedAt = r.updated_at ?? r.created_at ?? "";
      return [
        r.file_name ?? "Document",
        ext.vendorName ?? "—",
        ext.totalAmount ?? "—",
        ext.date ?? "—",
        r.intuit_tid ?? "",
        r.id ?? "",
        syncedAt,
      ].map(escapeCsvCell).join(",");
    });
  const csv = [header.join(","), ...body].join("\n");
  const count = body.length;
  const filename = `velodoc-weekly-sync-report-${new Date().toISOString().slice(0, 10)}.csv`;

  // Weekly CSV Report is sent exclusively to Phillip McKenzie at admin@velodoc.app
  const adminEmail = (process.env.WEEKLY_REPORT_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@velodoc.app").trim();
  const recipients: string[] = [adminEmail];
  const supabaseClient = getSupabase();

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const replyTo = process.env.REPLY_TO ?? "billing@velodoc.app";
  const adminSignature = getEmailSignature("admin");
  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family: Inter, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:32px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#22d3ee; padding:32px 40px; text-align:center;">
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">Weekly Architectural Sync Report</h1>
              <p style="margin:8px 0 0; font-size:15px; color:rgba(15,23,42,0.9);">${count} document(s) synced in the last 7 days. CSV attached.</p>
              <p style="margin:12px 0 0; font-size:13px; color:rgba(15,23,42,0.8);">Addressed to Phillip McKenzie, Admin.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px; font-size:16px; color:#374151; line-height:1.6;">Your weekly QuickBooks sync summary is ready. Open the attachment for the full architectural log.</p>
              <a href="${ARCHITECTURAL_LOGS_URL}" style="display:inline-block; padding:14px 28px; background:#22d3ee; color:#0f172a; font-size:15px; font-weight:600; text-decoration:none; border-radius:10px;">View Architectural Logs</a>
              ${paymentRows.length > 0 ? `
              <div style="margin-top:24px;">
                <p style="margin:0 0 8px; font-size:14px; font-weight:600; color:#0f172a;">Payments this week (${paymentRows.length})</p>
                <table role="presentation" style="width:100%; border-collapse:collapse; font-size:13px;">
                  <tr style="border-bottom:1px solid #e5e7eb;"><th style="text-align:left; padding:6px 0;">Plan</th><th style="text-align:right; padding:6px 0;">Amount</th><th style="text-align:left; padding:6px 0;">Date</th></tr>
                  ${paymentRows.slice(0, 20).map((p) => {
                    const amt = p.amount_total_cents != null ? `$${(p.amount_total_cents / 100).toFixed(2)}` : "—";
                    const date = p.created_at ? new Date(p.created_at).toLocaleDateString() : "—";
                    return `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:6px 0;">${escapeHtml(String(p.plan ?? "—"))}</td><td style="text-align:right; padding:6px 0;">${amt}</td><td style="padding:6px 0;">${date}</td></tr>`;
                  }).join("")}
                </table>
              </div>
              ` : ""}
              ${adminSignature}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resend = new Resend(resendApiKey);
  const sent: string[] = [];
  try {
    for (const toEmail of recipients) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        replyTo,
        subject: `VeloDoc Weekly Sync Report – ${count} document(s)`,
        text: `Weekly QuickBooks sync report: ${count} document(s) with qb_sync_status = synced in the last 7 days. CSV attached.\n\nView Architectural Logs: ${ARCHITECTURAL_LOGS_URL}`,
        html: htmlBody,
        attachments: [
          {
            filename,
            content: Buffer.from(csv, "utf-8").toString("base64"),
          },
        ],
      });
      sent.push(toEmail);
      // Track monthly automation usage (reset automation_count in your billing cron)
      if (supabaseClient) {
        const { data: prof } = await supabaseClient.from("profiles").select("automation_count").eq("email", toEmail).maybeSingle();
        const current = (prof as { automation_count?: number } | null)?.automation_count ?? 0;
        await supabaseClient.from("profiles").update({ automation_count: current + 1 }).eq("email", toEmail);
      }
    }
  } catch (err) {
    console.error("[weekly-report] Resend error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    documentsCount: count,
    recipients: sent,
  });
}
