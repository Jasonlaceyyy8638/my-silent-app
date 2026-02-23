"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignedIn, SignedOut, UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { ChevronDown, Monitor } from "lucide-react";

const SOLUTIONS_LINKS = [
  { href: "/solutions#logistics", label: "Logistics & Freight" },
  { href: "/solutions#legal", label: "Legal & Contracts" },
  { href: "/solutions#finance", label: "Finance & Accounting" },
  { href: "/solutions#education", label: "Education & Research" },
  { href: "/solutions#retail", label: "Retail & Procurement" },
] as const;

export function Header() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-petroleum/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-teal-accent/50 rounded"
          >
            <Image
              src="/logo-png.png"
              alt="VeloDoc"
              width={120}
              height={48}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-white transition-colors rounded-lg"
            >
              Home
            </Link>
            <Link
              href="/features"
              className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-white transition-colors rounded-lg"
            >
              Features
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onMouseEnter={() => setSolutionsOpen(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-200 hover:text-white transition-colors rounded-lg"
                aria-expanded={solutionsOpen}
                aria-haspopup="true"
              >
                Solutions
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${solutionsOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {solutionsOpen && (
                <div
                  className="absolute left-0 top-full pt-1 min-w-[220px]"
                  onMouseLeave={() => setSolutionsOpen(false)}
                >
                  <div className="rounded-xl border border-white/20 bg-petroleum/95 backdrop-blur-xl shadow-xl py-2 border-t-teal-accent/30">
                    {SOLUTIONS_LINKS.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="block px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setSolutionsOpen(false)}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-white transition-colors rounded-lg"
            >
              Pricing
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-white transition-colors rounded-lg"
              >
                Dashboard
              </Link>
            </SignedIn>
          </nav>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/download"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Monitor className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Get the App</span>
          </Link>
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
            href="/pricing"
            className="inline-flex items-center rounded-lg bg-teal-accent px-4 py-2 text-sm font-medium text-petroleum hover:bg-lime-accent transition-colors"
          >
            Buy Credits
          </Link>
          <SignedIn>
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              appearance={{
                ...clerkAppearance,
                elements: {
                  ...clerkAppearance.elements,
                  organizationSwitcherTrigger:
                    "rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-slate-200 px-3 py-2 h-9",
                },
              }}
            />
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                ...clerkAppearance,
                elements: {
                  ...clerkAppearance.elements,
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
