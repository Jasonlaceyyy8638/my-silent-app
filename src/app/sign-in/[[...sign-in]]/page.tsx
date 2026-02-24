import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { OAuthErrorLogger } from "@/components/OAuthErrorLogger";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center">
      <Suspense fallback={null}>
        <OAuthErrorLogger />
      </Suspense>
      <SignIn afterSignInUrl="/dashboard" signUpUrl="/sign-up" appearance={clerkAppearance} />
    </main>
  );
}
