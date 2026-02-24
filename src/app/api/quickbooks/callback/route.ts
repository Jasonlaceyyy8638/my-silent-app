import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

const INTUIT_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

/**
 * GET: QuickBooks OAuth callback. Exchange code for access_token and refresh_token,
 * then save to profiles table for the current user.
 * Query: code (required), redirect_uri (optional, defaults to this route URL).
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(`${base}/sign-in?redirect_url=${encodeURIComponent(request.url)}`);
  }

  const code = request.nextUrl.searchParams.get("code");
  const realmId = request.nextUrl.searchParams.get("realmId")?.trim() ?? null;
  if (!code || !code.trim()) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=no_code`);
  }

  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=config`);
  }

  const redirectUri =
    process.env.QB_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/api/quickbooks/callback`;
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
      const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
      return NextResponse.redirect(`${base}/dashboard?qb=error&reason=exchange`);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    accessToken = tokenData.access_token ?? "";
    refreshToken = tokenData.refresh_token ?? "";
    if (!accessToken || !refreshToken) {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
      return NextResponse.redirect(`${base}/dashboard?qb=error&reason=no_tokens`);
    }
  } catch (err) {
    console.error("[quickbooks/callback] token request error:", err);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=exchange`);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const row: Record<string, unknown> = {
        user_id: userId,
        qb_access_token: accessToken,
        qb_refresh_token: refreshToken,
      };
      if (realmId) row.qb_realm_id = realmId;
      const { error } = await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
      if (error) {
        console.error("[quickbooks/callback] profiles upsert error:", error);
      }
    } catch (err) {
      console.error("[quickbooks/callback] profiles save error:", err);
    }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  return NextResponse.redirect(`${base}/dashboard?qb=connected`);
}
