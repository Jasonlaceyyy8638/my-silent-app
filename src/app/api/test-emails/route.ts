import { NextResponse } from "next/server";
import {
  sendWithSendGrid,
  SENDGRID_FROM_SUPPORT,
  SENDGRID_FROM_BILLING,
  SENDGRID_FROM_SALES,
  SENDGRID_FROM_ADMIN,
} from "@/lib/sendgrid";

const SIGNATURE = "Jason Lacey | VeloDoc Architectural Lead";

type TestResult = { department: string; from: string; subject: string; ok: boolean; message?: string; statusCode?: number };

/**
 * POST /api/test-emails
 * Sends four test emails (Support, Billing, Sales, Admin) to verify each sender identity.
 * Requires: SENDGRID_API_KEY, TEST_EMAIL_TO (your inbox). Optional: TEST_EMAIL_SECRET in body or header.
 * Logs each response to the console for verified-sender / failure inspection.
 */
export async function POST(request: Request) {
  const to = process.env.TEST_EMAIL_TO?.trim();
  if (!to) {
    console.error("[test-emails] TEST_EMAIL_TO is not set. Set it to your personal inbox in .env");
    return NextResponse.json(
      { error: "TEST_EMAIL_TO not set. Add TEST_EMAIL_TO=your@email.com to env." },
      { status: 400 }
    );
  }

  if (!process.env.SENDGRID_API_KEY?.trim()) {
    console.error("[test-emails] SENDGRID_API_KEY is not set");
    return NextResponse.json({ error: "SENDGRID_API_KEY not set" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const secret = request.headers.get("x-test-email-secret") ?? body?.secret ?? "";
  const envSecret = process.env.TEST_EMAIL_SECRET?.trim();
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tests: Array<{ from: string; subject: string; department: string }> = [
    { from: SENDGRID_FROM_SUPPORT, subject: "Support Channel Test", department: "Support" },
    { from: SENDGRID_FROM_BILLING, subject: "Billing Channel Test", department: "Billing" },
    { from: SENDGRID_FROM_SALES, subject: "Monday 8 AM Report Test", department: "Sales" },
    { from: SENDGRID_FROM_ADMIN, subject: "System Admin Test", department: "Admin" },
  ];

  const html = `
    <p>This is a test email to verify the <strong>${"{{department}}"}</strong> sender identity.</p>
    <p>If you received this, the from address is correctly verified in SendGrid.</p>
    <p style="margin-top:24px; font-size:14px; color:#64748b;">${SIGNATURE}</p>
  `;

  const results: TestResult[] = [];

  for (const { from, subject, department } of tests) {
    const bodyHtml = html.replace("{{department}}", department);
    try {
      await sendWithSendGrid({
        from,
        to,
        subject,
        html: bodyHtml,
        text: `This is a test email for ${department}. If you received this, the from address is verified.\n\n${SIGNATURE}`,
      });
      const msg = `[test-emails] ${department} (${from}): sent successfully`;
      console.log(msg);
      results.push({ department, from, subject, ok: true });
    } catch (err) {
      const statusCode = (err as { response?: { statusCode?: number } })?.response?.statusCode;
      const message = err instanceof Error ? err.message : String(err);
      const msg = `[test-emails] ${department} (${from}): FAILED — ${message}${statusCode != null ? ` (status ${statusCode})` : ""}`;
      console.error(msg, err);
      results.push({
        department,
        from,
        subject,
        ok: false,
        message,
        statusCode: statusCode ?? undefined,
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({
    ok: failed.length === 0,
    to,
    results,
    summary:
      failed.length === 0
        ? "All four departmental senders verified successfully."
        : `${failed.length} sender(s) failed verification. Check console and SendGrid for details.`,
  });
}
