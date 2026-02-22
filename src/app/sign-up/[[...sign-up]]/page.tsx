import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center">
      <SignUp afterSignUpUrl="/dashboard" signInUrl="/sign-in" />
    </main>
  );
}
