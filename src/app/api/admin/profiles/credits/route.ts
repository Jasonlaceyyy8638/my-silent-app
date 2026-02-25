import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isAdminUser } from "@/lib/admin-auth";
import { sendWithSendGrid, SENDGRID_FROM_BILLING } from "@/lib/sendgrid";

const LOGO_URL = "https://velodoc.app/logo-png.png";

/**
 * PATCH /api/admin/profiles/credits
 * Body: { user_id: string, mode: "add" | "reset", value: number }
 * - mode "add": add value to current credits_remaining.
 * - mode "reset": set credits_remaining to value.
 * Only allowed for primary admin (ADMIN_EMAIL). Updates profiles.credits_remaining in Supabase.
 * Sends confirmation email from billing@velodoc.app to the user's profile email.
 */
export async function PATCH(req: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: { user_id?: string; mode?: string; value?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId =
    typeof body.user_id === "string" && body.user_id.trim()
      ? body.user_id.trim()
      : undefined;
  const mode =
    body.mode === "add" || body.mode === "reset" ? body.mode : undefined;
  const value =
    typeof body.value === "number" && !Number.isNaN(body.value)
      ? Math.floor(body.value)
      : undefined;

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json(
      { error: "mode required: 'add' or 'reset'" },
      { status: 400 }
    );
  }
  if (value === undefined || (mode === "add" && value < 0)) {
    return NextResponse.json(
      { error: "value required (non-negative number; for add, can be 0)" },
      { status: 400 }
    );
  }
  if (mode === "reset" && value < 0) {
    return NextResponse.json(
      { error: "value must be non-negative for reset" },
      { status: 400 }
    );
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
    .select("user_id, email, credits_remaining, credits_allowance_remaining, credits_topup_remaining")
    .eq("user_id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("[admin/profiles/credits] fetch error:", fetchError);
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 }
    );
  }

  const current =
    typeof (profile as { credits_remaining?: number }).credits_remaining === "number"
      ? Math.max(0, Math.floor((profile as { credits_remaining: number }).credits_remaining))
      : 0;
  const topup =
    typeof (profile as { credits_topup_remaining?: number }).credits_topup_remaining === "number"
      ? Math.max(0, Math.floor((profile as { credits_topup_remaining: number }).credits_topup_remaining))
      : 0;
  let newAllowance: number;
  let newTopup: number;
  let newTotal: number;
  const currentAllowance = Math.max(0, Math.floor((profile as { credits_allowance_remaining?: number }).credits_allowance_remaining ?? 0));
  if (mode === "add") {
    newAllowance = currentAllowance;
    newTopup = topup + value;
    newTotal = current + value;
  } else {
    newAllowance = Math.max(0, value);
    newTopup = 0;
    newTotal = Math.max(0, value);
  }
  const userEmail = (profile as { email?: string | null }).email?.trim();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      credits_allowance_remaining: newAllowance,
      credits_topup_remaining: newTopup,
      credits_remaining: newTotal,
      low_credit_alert_sent: false,
    })
    .eq("user_id", userId)
    .select("user_id, credits_remaining")
    .single();

  if (error) {
    console.error("[admin/profiles/credits] update error:", error);
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 }
    );
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
      console.error("[admin/profiles/credits] SendGrid confirmation email failed:", err);
    }
  }

  return NextResponse.json({ ok: true, profile: data, credits_remaining: newTotal });
}
