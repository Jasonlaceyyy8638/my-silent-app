"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Logs Clerk OAuth/sign-up errors from URL params to the console so we can
 * diagnose "Redirect URI Mismatch", "Missing Client Secret", or a secondary
 * security challenge (e.g. after disabling Attack Protection captcha). Sign-up
 * and sign-in use a single redirect (afterSignUpUrl/afterSignInUrl) to avoid
 * Apple OAuth redirect loops; if Apple still triggers a challenge, verify
 * Apple redirect URIs in Clerk Dashboard match the app URL exactly.
 */
export function OAuthErrorLogger() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const status = searchParams.get("__clerk_status");
    const error = searchParams.get("__clerk_error") ?? searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    if (status === "error" || error || errorDescription) {
      console.error("[Clerk OAuth / Sign-up error]", {
        __clerk_status: status,
        __clerk_error: error,
        error,
        error_description: errorDescription,
        allParams: params,
      });
    }
  }, [searchParams]);

  return null;
}
