"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  OrganizationProfile,
  OrganizationSwitcher,
  CreateOrganization,
  useOrganization,
} from "@clerk/nextjs";
import { clerkTeamAppearance } from "@/lib/clerk-appearance";
import { Zap, ChevronRight } from "lucide-react";

type TeamUsageEntry = { user_id: string; credits_used: number };

function TeamCreditUsageBento() {
  const [usage, setUsage] = useState<TeamUsageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization?.id) {
      setUsage([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/team-usage")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.usage)) setUsage(data.usage);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organization?.id]);

  const total = usage.reduce((s, u) => s + u.credits_used, 0);
  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-teal-accent/10 flex items-center justify-center text-teal-accent">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Team Credit Usage</h2>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-wider">{monthLabel}</p>
        </div>
      </div>
      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading usage…</div>
      ) : usage.length === 0 ? (
        <p className="text-slate-400 text-sm py-4">No usage recorded this month.</p>
      ) : (
        <>
          <div className="rounded-xl border border-white/10 bg-petroleum/40 p-4 mb-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total this month</p>
            <p className="text-2xl font-bold text-teal-accent tabular-nums">{total}</p>
            <p className="text-slate-400 text-xs">credits</p>
          </div>
          <ul className="space-y-2">
            {usage.map(({ user_id, credits_used }) => (
              <li
                key={user_id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-petroleum/40 px-4 py-3"
              >
                <span className="text-slate-300 text-sm font-mono truncate max-w-[180px]" title={user_id}>
                  {user_id.slice(0, 8)}…
                </span>
                <span className="text-teal-accent font-semibold tabular-nums">{credits_used}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function TeamSettingsPage() {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-12 text-center text-slate-400">
            Loading…
          </div>
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 sm:p-12 text-center border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/settings/team"
                afterSelectOrganizationUrl="/settings/team"
                appearance={clerkTeamAppearance}
              />
              <CreateOrganization
                afterCreateOrganizationUrl="/settings/team"
                appearance={clerkTeamAppearance}
              />
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold px-5 py-2.5 transition-colors"
            >
              Go to Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="max-w-6xl mx-auto px-6 py-8 sm:py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Team Settings</h1>
            <p className="text-slate-400 text-sm mt-0.5">Invite members and view team credit usage</p>
          </div>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/settings/team"
              afterSelectOrganizationUrl="/settings/team"
              appearance={clerkTeamAppearance}
            />
            <Link
              href="/dashboard"
              className="text-sm font-medium text-teal-accent hover:text-lime-accent transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl overflow-hidden border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] [&_.cl-rootBox]:!rounded-2xl [&_.cl-card]:!rounded-2xl [&_.cl-card]:!border [&_.cl-card]:!border-white/20 [&_.cl-card]:!bg-white/[0.07] [&_.cl-card]:!backdrop-blur-xl [&_.cl-card]:!border-t-teal-accent/30 flex justify-center">
            <OrganizationProfile
              appearance={clerkTeamAppearance}
              routing="hash"
            />
          </div>
          <div>
            <TeamCreditUsageBento />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold px-5 py-2.5 transition-colors"
          >
            Go to Dashboard
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
