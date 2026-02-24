import Link from "next/link";
import { CheckCircle } from "lucide-react";

type SuccessPageProps = {
  searchParams: Promise<{ plan?: string; credits?: string }>;
};

const SUBSCRIPTION_PLANS = ["starter", "pro", "enterprise"] as const;

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const plan = params?.plan ?? "";
  const creditsParam = params?.credits;
  const isSubscription = SUBSCRIPTION_PLANS.includes(plan as (typeof SUBSCRIPTION_PLANS)[number]);
  const creditsLabel =
    creditsParam !== undefined
      ? `${creditsParam} VeloCredits Added`
      : plan === "velopack"
        ? "20 VeloCredits Added"
        : plan === "starter"
          ? "1 VeloCredit Added"
          : "20 VeloCredits Added";

  if (isSubscription) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-md w-full">
          <div className="flex justify-center mb-8">
            <CheckCircle
              className="h-24 w-24 text-lime-accent drop-shadow-lg animate-checkmark-pop"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Platform unlocked!
          </h1>
          <p className="text-slate-200 mb-8 text-lg">
            Your subscription is active. Now, buy credits to start extracting data from your PDFs.
          </p>
          <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-5 py-4 mb-8 text-left">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Order Summary
            </h2>
            <p className="text-white font-medium">Subscription — {plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Plans provide platform access and integrations. Document processing uses a separate credit balance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum font-medium px-6 py-3 text-base transition-colors shadow-teal-glow"
            >
              Buy Credits
            </Link>
            <span className="text-slate-500">or</span>
            <Link
              href="/dashboard"
              className="text-teal-accent hover:underline font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-md w-full">
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
