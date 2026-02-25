"use client";

import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { Laptop, Shield } from "lucide-react";

const ADMIN_EMAIL = "jasonlaceyyy8638@gmail.com";

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
    avatarBox: "h-9 w-9",
    userButtonPopoverCard:
      "rounded-2xl border border-white/20 bg-[#0b172a]/95 backdrop-blur-xl border-t-[#22d3ee]/40 shadow-xl",
  },
};

/**
 * User Action Group: Buy Credits (primary CTA), User Profile.
 * Organization switcher lives in WorkspaceBadge (left of navbar).
 * "Download Desktop" is in the User profile dropdown with a Laptop icon.
 */
export function UserActions() {
  const { user } = useUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = (primaryEmail ?? "").trim().toLowerCase() === ADMIN_EMAIL;

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
      {/* Primary CTA — most prominent */}
      <Link
        href="/pricing"
        className="inline-flex items-center rounded-lg bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#0b172a] hover:bg-[#22d3ee]/90 transition-colors shadow-sm"
      >
        Buy Credits
      </Link>

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
            {isAdmin && (
              <UserButton.Link
                href="/admin"
                label="Admin"
                labelIcon={<Shield className="w-4 h-4" />}
              />
            )}
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
