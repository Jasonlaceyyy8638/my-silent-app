import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { OAuthErrorLogger } from "@/components/OAuthErrorLogger";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex flex-col items-center justify-center gap-4">
      <Suspense fallback={null}>
        <OAuthErrorLogger />
      </Suspense>
      <SignIn
        afterSignInUrl={baseUrl ? `${baseUrl}/dashboard` : "/dashboard"}
        signUpUrl={baseUrl ? `${baseUrl}/sign-up` : "/sign-up"}
        appearance={clerkAppearance}
      />
      <a
        href={baseUrl ? `${baseUrl}/forgot-password` : "/forgot-password"}
        className="text-teal-accent hover:text-teal-300 text-sm"
      >
        Forgot password?
      </a>
    </main>
  );
}
