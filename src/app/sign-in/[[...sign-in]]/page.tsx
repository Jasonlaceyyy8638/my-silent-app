import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { OAuthErrorLogger } from "@/components/OAuthErrorLogger";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center">
      <Suspense fallback={null}>
        <OAuthErrorLogger />
      </Suspense>
      <SignIn
        afterSignInUrl={baseUrl ? `${baseUrl}/dashboard` : "/dashboard"}
        signUpUrl={baseUrl ? `${baseUrl}/sign-up` : "/sign-up"}
        appearance={clerkAppearance}
      />
    </main>
  );
}
