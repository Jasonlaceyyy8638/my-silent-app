"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import { UserActions } from "@/components/UserActions";

const SOLUTIONS_LINKS = [
  { href: "/solutions/legal", label: "Legal & Contracts" },
  { href: "/solutions/medical", label: "Medical & Healthcare" },
  { href: "/solutions/finance", label: "Finance & Accounting" },
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b172a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 sm:gap-10 px-4 sm:px-6">
        <div className="flex items-center gap-8 min-w-0">
          <Link
            href="/"
            className="flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-accent/50 rounded"
          >
            <Image
              src="/logo-png.png"
              alt="VeloDoc"
              width={200}
              height={80}
              className="h-14 w-auto"
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
                  <div className="rounded-xl border border-white/20 bg-[#0f172a]/95 backdrop-blur-xl shadow-xl py-2 border-t-teal-accent/30">
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
        <div className="flex items-center shrink-0 min-w-0">
          <UserActions />
        </div>
      </div>
    </header>
  );
}
