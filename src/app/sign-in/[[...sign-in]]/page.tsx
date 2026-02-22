import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center">
      <SignIn afterSignInUrl="/dashboard" signUpUrl="/sign-up" />
    </main>
  );
}
