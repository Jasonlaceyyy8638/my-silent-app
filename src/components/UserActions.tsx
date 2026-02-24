"use client";

import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { Laptop } from "lucide-react";

/** Petroleum Blue #0b172a + Teal #22d3ee glassmorphism for User Action Group */
const actionGroupAppearance = {
  ...clerkAppearance,
  variables: {
    ...clerkAppearance.variables,
    colorPrimary: "#22d3ee",
    colorBackground: "#0b172a",
    colorInputBackground: "#0b172a",
  },
  elements: {
    ...clerkAppearance.elements,
    rootBox: "rounded-xl",
    card: "rounded-2xl border border-white/20 bg-[#0b172a]/95 backdrop-blur-xl border-t-[#22d3ee]/40 shadow-xl",
    organizationSwitcherTrigger:
      "rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 h-8 text-sm font-medium",
    avatarBox: "h-9 w-9",
    userButtonPopoverCard:
      "rounded-2xl border border-white/20 bg-[#0b172a]/95 backdrop-blur-xl border-t-[#22d3ee]/40 shadow-xl",
  },
};

/**
 * User Action Group: Buy Credits (primary CTA), Organization Switcher, User Profile.
 * "Download Desktop" is in the User profile dropdown with a Laptop icon.
 */
export function UserActions() {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
      {/* Primary CTA — most prominent */}
      <Link
        href="/pricing"
        className="inline-flex items-center rounded-lg bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#0b172a] hover:bg-[#22d3ee]/90 transition-colors shadow-sm"
      >
        Buy Credits
      </Link>

      {/* Org switcher between Buy Credits and User Profile (signed in only) */}
      <SignedIn>
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
          appearance={actionGroupAppearance}
        />
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            Sign In
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={actionGroupAppearance}
        >
          <UserButton.MenuItems>
            <UserButton.Link
              href="/download"
              label="Download Desktop"
              labelIcon={<Laptop className="w-4 h-4" />}
            />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
    </div>
  );
}
