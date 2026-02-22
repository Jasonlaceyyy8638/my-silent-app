"use client";

import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-petroleum/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-teal-accent/50 rounded">
            <Image
              src="/logo-png.png"
              alt="VeloDoc"
              width={120}
              height={48}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Home
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-200 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </SignedIn>
          </nav>
        </div>
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
