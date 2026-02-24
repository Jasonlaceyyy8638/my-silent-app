import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const INTUIT_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";

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
    process.env.QUICKBOOKS_REDIRECT_URI ??
    `${base}/api/quickbooks/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${base}/dashboard?qb=error&reason=config`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "com.intuit.quickbooks.account",
    state: "velodoc",
  });

  const authUrl = `${INTUIT_AUTH_URL}?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
