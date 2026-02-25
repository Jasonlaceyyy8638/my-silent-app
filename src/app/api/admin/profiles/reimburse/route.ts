import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isAdminUser, getCurrentUserEmail } from "@/lib/admin-auth";
import { sendWithSendGrid, SENDGRID_FROM_BILLING } from "@/lib/sendgrid";

const LOGO_URL = "https://velodoc.app/logo-png.png";

/**
 * POST /api/admin/profiles/reimburse
 * Body: { user_id: string, amount: number, reason: string }
 * Adds amount to credits_remaining, logs in credit_logs, sends confirmation from billing@velodoc.app.
 * Only allowed for primary admin (jasonlaceyyy8638@gmail.com).
 */
export async function POST(req: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: { user_id?: string; amount?: number; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId =
    typeof body.user_id === "string" && body.user_id.trim()
      ? body.user_id.trim()
      : undefined;
  const amount =
    typeof body.amount === "number" && !Number.isNaN(body.amount)
      ? Math.floor(body.amount)
      : undefined;
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : undefined;

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }
  if (amount === undefined || amount < 1) {
    return NextResponse.json(
      { error: "amount required (positive integer)" },
      { status: 400 }
    );
  }
  if (!reason) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("user_id, email, credits_remaining")
    .eq("user_id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("[admin/profiles/reimburse] fetch error:", fetchError);
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 }
    );
  }

  const current =
    typeof (profile as { credits_remaining?: number }).credits_remaining ===
    "number"
      ? Math.max(
          0,
          Math.floor((profile as { credits_remaining: number }).credits_remaining)
        )
      : 0;
  const newTotal = current + amount;
  const userEmail = (profile as { email?: string | null }).email?.trim();
  const performedBy = (await getCurrentUserEmail()) ?? "admin";

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits_remaining: newTotal })
    .eq("user_id", userId);

  if (updateError) {
    console.error("[admin/profiles/reimburse] update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 }
    );
  }

  const { error: logError } = await supabase.from("credit_logs").insert({
    user_id: userId,
    credits_added: amount,
    reason,
    performed_by: performedBy,
  });

  if (logError) {
    console.error("[admin/profiles/reimburse] credit_logs insert error:", logError);
  }

  if (userEmail && process.env.SENDGRID_API_KEY?.trim()) {
    try {
      await sendWithSendGrid({
        from: SENDGRID_FROM_BILLING,
        to: userEmail,
        subject: "Your VeloDoc credits have been adjusted",
        text: `Your VeloDoc credits have been adjusted. Your new balance is ${newTotal} credits.\n\n— VeloDoc Billing`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
            <img src="${LOGO_URL}" alt="VeloDoc" width="140" style="display:block;margin:0 auto 20px;height:auto;" />
            <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Your VeloDoc credits have been adjusted. Your new balance is <strong style="color:#22d3ee;">${newTotal} credits</strong>.</p>
            <p style="margin:0;font-size:14px;color:#6b7280;">— VeloDoc Billing</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[admin/profiles/reimburse] SendGrid failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    credits_remaining: newTotal,
  });
}
