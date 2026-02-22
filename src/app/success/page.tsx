import Link from "next/link";
import { CheckCircle } from "lucide-react";

type SuccessPageProps = {
  searchParams: Promise<{ plan?: string; credits?: string }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const plan = params?.plan ?? "";
  const creditsParam = params?.credits;
  const creditsLabel =
    creditsParam !== undefined
      ? `${creditsParam} VeloCredits Added`
      : plan === "velopack"
        ? "20 VeloCredits Added"
        : plan === "starter"
          ? "1 VeloCredit Added"
          : "20 VeloCredits Added"; // mock default for celebratory layout

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-md w-full">
        {/* Animated checkmark */}
        <div className="flex justify-center mb-8">
          <CheckCircle
            className="h-24 w-24 text-lime-accent drop-shadow-lg animate-checkmark-pop"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Credits Successfully Added!
        </h1>
        <p className="text-slate-200 mb-8 text-lg">
          Your VeloDoc account has been fueled up. You can now start architecting your PDFs.
        </p>

        {/* Order Summary */}
        <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-5 py-4 mb-8 text-left">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Order Summary
          </h2>
          <p className="text-white font-medium">{creditsLabel}</p>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          Credits usually appear within a few seconds. If you don&apos;t see them, refresh the dashboard or try again in a moment.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum font-medium px-6 py-3 text-base transition-colors shadow-teal-glow"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
