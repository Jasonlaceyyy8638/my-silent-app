import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";

/** Production token endpoint (aligns with https://developer.intuit.com/.well-known/openid_configuration) */
const INTUIT_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

/**
 * GET: QuickBooks OAuth callback at /api/auth/callback/quickbooks.
 * Set QUICKBOOKS_REDIRECT_URI to https://velodoc.app/api/auth/callback/quickbooks in Netlify.
 * Exchange code for access_token and refresh_token, then save to profiles.
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
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=no_code`);
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
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
      return NextResponse.redirect(`${base}/dashboard?qb=error&reason=exchange`);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    accessToken = tokenData.access_token ?? "";
    refreshToken = tokenData.refresh_token ?? "";
    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(`${base}/dashboard?qb=error&reason=no_tokens`);
    }
  } catch (err) {
    console.error("[quickbooks/callback] token request error:", err);
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

  return NextResponse.redirect(`${base}/dashboard?qb=connected`);
}
