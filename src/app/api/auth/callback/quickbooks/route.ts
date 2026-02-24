import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";

/** Production token endpoint (aligns with https://developer.intuit.com/.well-known/openid_configuration) */
const INTUIT_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@velodoc.app";

async function sendErrorLogToAdmin(reason: string, detail: string, userId?: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const resend = new Resend(key);
    const from = process.env.WEEKLY_REPORT_FROM_EMAIL ?? process.env.FROM_EMAIL ?? "Phillip McKenzie <admin@velodoc.app>";
    await resend.emails.send({
      from,
      to: ADMIN_EMAIL,
      reply_to: process.env.REPLY_TO ?? "billing@velodoc.app",
      subject: `[VeloDoc] QuickBooks callback error: ${reason}`,
      text: `QuickBooks OAuth callback failed.\nReason: ${reason}\nDetail: ${detail}\nUser ID: ${userId ?? "unknown"}\n`,
    });
  } catch {
    // ignore send failure
  }
}

/**
 * GET: QuickBooks OAuth callback at /api/auth/callback/quickbooks.
 * Set QUICKBOOKS_REDIRECT_URI to https://velodoc.app/api/auth/callback/quickbooks in Netlify.
 * Receives realmId and code from Intuit; exchanges code for production tokens;
 * stores realmId, access_token, and refresh_token in the user's Supabase profile.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (!userId) {
    return NextResponse.redirect(`${base}/sign-in?redirect_url=${encodeURIComponent(request.url)}`);
  }

  const code = request.nextUrl.searchParams.get("code");
  const realmId = request.nextUrl.searchParams.get("realmId")?.trim() ?? null;

  if (!code || !code.trim()) {
    await sendErrorLogToAdmin("no_code", "Missing or empty code in callback", userId);
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=no_code`);
  }

  // Block starter plans from connecting QuickBooks; show upgrade modal on dashboard
  const supabaseForPlan = getSupabase();
  if (supabaseForPlan) {
    const { data: profile } = await supabaseForPlan
      .from("profiles")
      .select("plan_type")
      .eq("user_id", userId)
      .maybeSingle();
    const planType = (profile as { plan_type?: string } | null)?.plan_type ?? "starter";
    if (planType === "starter") {
      return NextResponse.redirect(`${base}/dashboard?qb=upgrade`);
    }
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    await sendErrorLogToAdmin("config", "QUICKBOOKS_CLIENT_ID or QUICKBOOKS_CLIENT_SECRET missing", userId);
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=config`);
  }

  const redirectUri =
    (process.env.QUICKBOOKS_REDIRECT_URI ?? "").trim() ||
    `${base}/api/auth/callback/quickbooks`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code.trim(),
    redirect_uri: redirectUri,
  });

  let accessToken: string;
  let refreshToken: string;
  try {
    const tokenRes = await fetch(INTUIT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[quickbooks/callback] token exchange failed:", tokenRes.status, errText);
      await sendErrorLogToAdmin("exchange", `${tokenRes.status}: ${errText.slice(0, 200)}`, userId);
      return NextResponse.redirect(`${base}/dashboard?qb=error&reason=exchange`);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    accessToken = tokenData.access_token ?? "";
    refreshToken = tokenData.refresh_token ?? "";
    if (!accessToken || !refreshToken) {
      await sendErrorLogToAdmin("no_tokens", "Token response missing access_token or refresh_token", userId);
      return NextResponse.redirect(`${base}/dashboard?qb=error&reason=no_tokens`);
    }
  } catch (err) {
    console.error("[quickbooks/callback] token request error:", err);
    await sendErrorLogToAdmin("exchange", err instanceof Error ? err.message : String(err), userId);
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=exchange`);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const row: Record<string, unknown> = {
        user_id: userId,
        qb_access_token: accessToken,
        qb_refresh_token: refreshToken,
        qb_realm_id: realmId ?? null,
      };
      const { error } = await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
      if (error) {
        console.error("[quickbooks/callback] profiles upsert error:", error);
      }
    } catch (err) {
      console.error("[quickbooks/callback] profiles save error:", err);
    }
  }

  return NextResponse.redirect(`${base}/dashboard?sync=success`);
}
