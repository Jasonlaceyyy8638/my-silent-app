import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-surface-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-accent mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Payment successful
        </h1>
        <p className="text-zinc-400 mb-8">
          Thanks for your purchase. Your 10 credits are ready to use.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-surface-950 hover:bg-accent-muted transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
