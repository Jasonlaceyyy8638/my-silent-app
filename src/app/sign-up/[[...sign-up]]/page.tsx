import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { clerkAppearance, PASSWORD_REQUIREMENT_HINT } from "@/lib/clerk-appearance";
import { OAuthErrorLogger } from "@/components/OAuthErrorLogger";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

/**
 * Sign-up uses Clerk's prebuilt form only. No custom captcha, Turnstile, or hidden
 * verification fields—Attack Protection/captcha is controlled in Clerk Dashboard.
 * Single redirect (afterSignUpUrl) to avoid Apple OAuth secondary security challenges.
 * Absolute redirect URLs (when NEXT_PUBLIC_APP_URL is set) help mobile/external browser redirects.
 */
export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex flex-col items-center justify-center gap-4 py-8">
      <Suspense fallback={null}>
        <OAuthErrorLogger />
      </Suspense>
      <p className="text-slate-400 text-sm text-center max-w-[320px] px-4" aria-live="polite">
        {PASSWORD_REQUIREMENT_HINT}
      </p>
      <SignUp
        afterSignUpUrl={baseUrl ? `${baseUrl}/dashboard` : "/dashboard"}
        signInUrl={baseUrl ? `${baseUrl}/sign-in` : "/sign-in"}
        appearance={clerkAppearance}
      />
    </main>
  );
}
