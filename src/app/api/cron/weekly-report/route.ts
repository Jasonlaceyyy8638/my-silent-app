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

  return await buildAndSendReport(rows, request);
}

async function buildAndSendReport(rows: DocRow[], _request: Request): Promise<NextResponse> {
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

  // Only send to profiles with plan_type 'pro' or 'enterprise' (starter has no automated report)
  const supabaseClient = getSupabase();
  const recipients: string[] = [];
  if (supabaseClient) {
    const { data: profileRows } = await supabaseClient
      .from("profiles")
      .select("email, plan_type")
      .in("plan_type", ["pro", "enterprise"])
      .not("email", "is", null);
    const profiles = (profileRows ?? []) as { email?: string; plan_type?: string }[];
    for (const p of profiles) {
      const email = p.email?.trim();
      if (email) recipients.push(email);
    }
  }
  // Env override or default admin: always send CSV to admin@velodoc.app when no pro/enterprise recipients
  const adminEmail = (process.env.WEEKLY_REPORT_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@velodoc.app").trim();
  if (recipients.length === 0) {
    recipients.push(adminEmail);
  } else {
    const envEmail = process.env.WEEKLY_REPORT_EMAIL?.trim();
    if (envEmail && !recipients.includes(envEmail)) recipients.push(envEmail);
  }

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
        reply_to: replyTo,
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
