import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import type { ExtractedRow } from "@/types";

const FROM_EMAIL = process.env.WEEKLY_REPORT_FROM_EMAIL ?? process.env.FROM_EMAIL ?? "reports@velodoc.app";

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

  let toEmail: string | null = process.env.WEEKLY_REPORT_EMAIL?.trim() ?? null;

  if (!toEmail) {
    const supabaseClient = getSupabase();
    if (supabaseClient) {
      const { data: profileRow } = await supabaseClient
        .from("profiles")
        .select("email")
        .not("email", "is", null)
        .limit(1)
        .maybeSingle();
      const profile = profileRow as { email?: string } | null;
      toEmail = profile?.email?.trim() ?? null;
    }
  }

  if (!toEmail) {
    return NextResponse.json(
      { error: "No recipient: set WEEKLY_REPORT_EMAIL or add email to profiles" },
      { status: 400 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `VeloDoc Weekly Sync Report – ${count} document(s)`,
      text: `Weekly QuickBooks sync report: ${count} document(s) with qb_sync_status = synced in the last 7 days. CSV attached.`,
      html: `<p>Weekly QuickBooks sync report: <strong>${count}</strong> document(s) synced in the last 7 days.</p><p>CSV attached.</p>`,
      attachments: [
        {
          filename,
          content: Buffer.from(csv, "utf-8").toString("base64"),
        },
      ],
    });
  } catch (err) {
    console.error("[weekly-report] Resend error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    documentsCount: count,
    recipient: toEmail,
  });
}
