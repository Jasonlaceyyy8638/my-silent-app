"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-petroleum/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <SignedIn>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-200 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
        </SignedIn>
        <SignedOut>
          <span />
        </SignedOut>
        <nav className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-teal-accent px-4 py-2 text-sm font-medium text-petroleum hover:bg-lime-accent transition-colors"
              >
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <Link
            href="/#pricing"
            className="inline-flex items-center rounded-lg bg-teal-accent px-4 py-2 text-sm font-medium text-petroleum hover:bg-lime-accent transition-colors"
          >
            Buy Credits
          </Link>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
