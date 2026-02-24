"use client";

import Link from "next/link";
import { OrganizationSwitcher, useOrganization } from "@clerk/nextjs";
import { Plus } from "lucide-react";

/** Petroleum Blue #0b172a + Teal #22d3ee pill badge with optional active glow */
const workspaceBadgeAppearance = {
  variables: {
    colorPrimary: "#22d3ee",
    colorBackground: "#0b172a",
    colorText: "#ffffff",
    colorTextSecondary: "#e2e8f0",
    borderRadius: "9999px",
  },
  elements: {
    rootBox: "rounded-full",
    organizationSwitcherTrigger:
      "rounded-full h-9 px-4 border border-white/20 bg-[#0b172a]/95 backdrop-blur-sm text-white text-sm font-medium shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:bg-white/10 hover:border-[#22d3ee]/40 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all duration-200",
    organizationSwitcherTriggerIcon: "text-[#22d3ee]",
    avatarBox: "h-5 w-5 rounded-full ring-1 ring-[#22d3ee]/50",
    card: "rounded-2xl border border-white/20 bg-[#0b172a]/95 backdrop-blur-xl border-t-[#22d3ee]/40 shadow-xl",
  },
};

/**
 * Workspace badge next to the logo: "+ Create Workspace" (teal) when no org,
 * or org name + logo in a Petroleum Blue pill with active glow when selected.
 */
export function WorkspaceBadge() {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <div className="h-9 w-[140px] rounded-full bg-white/5 animate-pulse shrink-0" aria-hidden />
    );
  }

  if (!organization) {
    return (
      <Link
        href="/settings/team"
        className="inline-flex items-center gap-2 rounded-full h-9 px-4 bg-[#22d3ee] text-[#0b172a] text-sm font-semibold hover:bg-[#22d3ee]/90 shadow-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-200 shrink-0"
      >
        <Plus className="w-4 h-4" aria-hidden />
        Create Workspace
      </Link>
    );
  }

  return (
    <OrganizationSwitcher
      hidePersonal
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
      appearance={workspaceBadgeAppearance}
    />
  );
}
