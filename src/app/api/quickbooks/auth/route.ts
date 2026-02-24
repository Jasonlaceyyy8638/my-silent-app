import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/** Production: https://developer.intuit.com/.well-known/openid_configuration */
const INTUIT_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";

/** Only these four scopes; no leading or trailing spaces. */
const QUICKBOOKS_SCOPES = "com.intuit.quickbooks.accounting openid profile email";

/**
 * GET: Redirect to Intuit QuickBooks OAuth 2.0 authorization (production).
 * If not signed in, redirects to sign-in with return_url back here.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (!userId) {
    const returnUrl = `${base}/api/quickbooks/auth`;
    return NextResponse.redirect(
      `${base}/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`
    );
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const redirectUri =
    (process.env.QUICKBOOKS_REDIRECT_URI ?? "").trim() ||
    `${base}/api/auth/callback/quickbooks`;

  if (!clientId) {
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=config`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: QUICKBOOKS_SCOPES,
    state: "velodoc",
  });

  const authUrl = `${INTUIT_AUTH_URL}?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
