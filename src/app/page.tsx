"use client";

import { useState, useCallback } from "react";
import {
  FileUp,
  LayoutGrid,
  Download,
  ShoppingCart,
  Briefcase,
  Home as HomeIcon,
  GraduationCap,
  Truck,
  Plug,
  Zap,
  FolderSync,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Testimonials } from "@/components/Testimonials";
import { TrustBar } from "@/components/TrustBar";
import { CaseStudies } from "@/components/CaseStudies";
import { ScrollSection } from "@/components/ScrollSection";
import { Industries } from "@/components/Industries";
import { BenefitsBento } from "@/components/BenefitsBento";

const MIN_BULK_CREDITS = 20;
const MAX_BULK_CREDITS = 1000;
const BULK_THRESHOLD = 100;
const PRICE_PER_CREDIT = 0.5;
const BULK_DISCOUNT = 0.12;

function getBulkPrice(credits: number): { total: number; perCredit: number; isBulk: boolean } {
  const isBulk = credits > BULK_THRESHOLD;
  const perCredit = isBulk ? PRICE_PER_CREDIT * (1 - BULK_DISCOUNT) : PRICE_PER_CREDIT;
  const total = Math.round(perCredit * credits * 100) / 100;
  return { total, perCredit, isBulk };
}

type Plan = "starter" | "velopack";

export default function Home() {
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [bulkCredits, setBulkCredits] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = useCallback(async (plan: Plan, credits?: number) => {
    setError(null);
    setCheckoutPlan(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          plan === "velopack" ? { plan, credits: credits ?? bulkCredits } : { plan }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setCheckoutPlan(null);
    }
  }, [bulkCredits]);

  const bulkPrice = getBulkPrice(bulkCredits);

  const integrations = [
    { name: "QuickBooks", icon: Plug, description: "Sync extracted data to your books." },
    { name: "Zapier", icon: Zap, description: "Connect to 5,000+ apps automatically." },
    { name: "Google Drive", icon: FolderSync, description: "Import and export from Drive." },
    { name: "Excel Online", icon: FileSpreadsheet, description: "Open and edit spreadsheets in the cloud." },
  ];

  const audiences = [
    {
      icon: Briefcase,
      title: "Professionals",
      description: "Extract data from vendor quotes and client contracts.",
    },
    {
      icon: HomeIcon,
      title: "Homeowners & Families",
      description: "Organize medical bills, tax documents, and insurance claims.",
    },
    {
      icon: GraduationCap,
      title: "Students & Academics",
      description: "Turn research papers and syllabi into structured study guides.",
    },
    {
      icon: Truck,
      title: "Logistics & Trade",
      description: "Automate invoices, BOLs, and work orders.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-teal-950/30">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <ScrollSection className="text-center mb-12 flex flex-col items-center">
          <img
            src="/logo-png.png"
            alt="VeloDoc"
            width={200}
            height={80}
            className="w-[200px] h-auto drop-shadow-[0_0_25px_rgba(34,211,238,0.3)] mb-8"
          />
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tighter text-white max-w-5xl mx-auto leading-[1.05]">
            Eliminate manual data entry. Forever.
          </h1>
          <p className="mt-8 text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            VeloDoc is the enterprise AI that turns unstructured PDFs into structured, queryable data—invoices, BOLs, contracts, and transcripts—with deterministic schemas and one-click export.
          </p>
          <p className="mt-4 text-slate-400 text-base max-w-2xl mx-auto">
            No templates, no rules. Context-aware extraction, 256-bit encryption, and audit-ready outputs so your team stops re-typing and starts scaling.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-6 py-3 text-sm font-semibold transition-colors"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-6 py-3 text-sm font-semibold transition-colors"
              >
                Get Started
              </Link>
            </SignedOut>
          </div>
        </ScrollSection>

        <ScrollSection>
          <TrustBar />
        </ScrollSection>

        <ScrollSection className="mb-14 rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 border-t-teal-accent/30">
          <p className="text-center text-slate-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            <span className="text-white font-semibold">What it does:</span> VeloDoc is an AI Architect that turns complex PDFs into structured data for QuickBooks, Excel, and Zapier.
          </p>
        </ScrollSection>

        <ScrollSection className="mb-14 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8">
          <p className="text-center text-slate-200 text-lg max-w-3xl mx-auto">
            Most apps just search for text. <span className="text-white font-semibold">VeloDoc understands it.</span> Whether you&apos;re a solo freelancer or a busy dispatcher, our AI eliminates manual entry forever.
          </p>
        </ScrollSection>

        <ScrollSection className="mb-14">
          <Industries />
        </ScrollSection>

        <ScrollSection className="mb-14">
          <BenefitsBento />
        </ScrollSection>

        <ScrollSection className="flex justify-center mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl justify-items-center">
            <div className="flex flex-col items-center text-center p-5 rounded-xl bg-white/5 border border-white/10 w-full max-w-[260px]">
              <FileUp className="h-10 w-10 text-teal-accent mb-3" />
              <h3 className="font-semibold text-white">Upload</h3>
              <p className="text-sm text-slate-300 mt-2">
                Drop any PDF—invoices, contracts, records, or quotes.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-5 rounded-xl bg-white/5 border border-white/10 w-full max-w-[260px]">
              <LayoutGrid className="h-10 w-10 text-teal-accent mb-3" />
              <h3 className="font-semibold text-white">Architect</h3>
              <p className="text-sm text-slate-300 mt-2">
                AI reads your document and extracts the data that matters.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-5 rounded-xl bg-white/5 border border-white/10 w-full max-w-[260px]">
              <Download className="h-10 w-10 text-teal-accent mb-3" />
              <h3 className="font-semibold text-white">Export</h3>
              <p className="text-sm text-slate-300 mt-2">
                Download as CSV or use in Excel, Google Sheets, and more.
              </p>
            </div>
          </div>
        </ScrollSection>

        <ScrollSection className="mb-14">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Who is VeloDoc for?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {audiences.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-teal-accent/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-teal-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="text-sm text-slate-300 mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollSection>

        <ScrollSection className="mb-14">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Quantified Wins
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 text-center border-t-teal-accent/30">
              <p className="text-4xl sm:text-5xl font-extrabold text-teal-accent tabular-nums">2M+</p>
              <p className="text-slate-300 font-medium mt-2">Documents Processed</p>
              <p className="text-slate-500 text-sm mt-1">Across enterprises and teams</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 text-center border-t-teal-accent/30">
              <p className="text-4xl sm:text-5xl font-extrabold text-teal-accent tabular-nums">500K+</p>
              <p className="text-slate-300 font-medium mt-2">Hours Saved</p>
              <p className="text-slate-500 text-sm mt-1">Estimated annualized</p>
            </div>
          </div>
        </ScrollSection>

        <ScrollSection>
          <CaseStudies />
        </ScrollSection>

        <ScrollSection>
          <Testimonials />
        </ScrollSection>

        <ScrollSection className="mb-14 text-center">
          <p className="text-slate-300 mb-4">
            Sign in to access the Architect. Buy credits to extract data from your PDFs.
          </p>
          <SignedOut>
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </SignedOut>
        </ScrollSection>

        <ScrollSection id="pricing" className="mb-14 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Simple pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 flex flex-col border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
              <h3 className="text-lg font-semibold text-white">Starter</h3>
              <p className="mt-1 text-3xl font-bold text-white">$1.00</p>
              <p className="text-slate-300 text-sm mt-1">1 Credit</p>
              <p className="text-slate-400 text-sm mt-2">For quick one-off tasks.</p>
              <button
                type="button"
                onClick={() => handleCheckout("starter")}
                disabled={checkoutPlan !== null}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-2.5 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                {checkoutPlan === "starter" ? "Redirecting…" : "Get Starter"}
              </button>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 flex flex-col border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] relative">
              <span className="absolute -top-2.5 right-6 rounded-full bg-lime-accent px-2.5 py-0.5 text-xs font-medium text-petroleum">
                Bulk discount
              </span>
              <h3 className="text-lg font-semibold text-white">VeloPack</h3>
              <p className="text-slate-400 text-sm mt-1">Choose 20–1,000 credits. 12% off over 100.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2 gap-4">
                    <label htmlFor="bulk-credits" className="text-slate-300 font-medium">
                      Credits
                    </label>
                    <input
                      type="number"
                      min={MIN_BULK_CREDITS}
                      max={MAX_BULK_CREDITS}
                      value={bulkCredits}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v)) setBulkCredits(Math.min(MAX_BULK_CREDITS, Math.max(MIN_BULK_CREDITS, v)));
                      }}
                      className="w-20 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-right font-mono text-sm font-semibold text-teal-accent tabular-nums focus:border-teal-accent focus:outline-none focus:ring-1 focus:ring-teal-accent"
                    />
                  </div>
                  <input
                    id="bulk-credits"
                    type="range"
                    min={MIN_BULK_CREDITS}
                    max={MAX_BULK_CREDITS}
                    step={10}
                    value={bulkCredits}
                    onChange={(e) => setBulkCredits(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-slate-700 accent-teal-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>20</span>
                    <span>1,000</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    ${bulkPrice.total.toFixed(2)}
                  </span>
                  {bulkPrice.isBulk && (
                    <span className="rounded bg-teal-accent/20 text-teal-accent text-xs font-medium px-2 py-0.5">
                      12% off
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs">
                  ${bulkPrice.perCredit.toFixed(2)}/credit
                  {bulkPrice.isBulk && " (bulk rate)"}
                </p>
                <button
                  type="button"
                  onClick={() => handleCheckout("velopack")}
                  disabled={checkoutPlan !== null}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-4 py-3 text-sm font-semibold disabled:opacity-70 disabled:pointer-events-none transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {checkoutPlan === "velopack" ? "Redirecting…" : `Get ${bulkCredits} Credits`}
                </button>
              </div>
              <p className="mt-6 pt-6 border-t border-white/10 text-slate-500 text-xs text-center">
                Need more than 5,000 credits?{" "}
                <a
                  href="mailto:sales@velodoc.app?subject=Enterprise%20credits%20inquiry"
                  className="text-teal-accent hover:underline font-medium"
                >
                  Contact Sales
                </a>
              </p>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-300 text-center" role="alert">
              {error}
            </p>
          )}
        </ScrollSection>

        <ScrollSection className="mb-14">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Integrations
          </h2>
          <p className="text-slate-300 text-center text-sm max-w-xl mx-auto mb-8">
            VeloDoc fits into your ecosystem. More integrations are on the way.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {integrations.map(({ name, icon: Icon, description }) => (
              <div
                key={name}
                className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 flex flex-col items-center text-center shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-teal-accent" />
                </div>
                <h3 className="font-semibold text-white">{name}</h3>
                <p className="text-slate-400 text-sm mt-1">{description}</p>
                <span className="mt-4 inline-block rounded-full bg-petroleum/80 border border-teal-accent/30 px-3 py-1 text-xs font-medium text-teal-accent">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </ScrollSection>

        <ScrollSection className="text-center">
          <p className="text-sm text-slate-400 mb-4">Works with your favorite tools</p>
          <div className="flex flex-wrap items-center justify-center gap-8 grayscale opacity-80">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 border border-white/10">
              <span className="text-sm font-medium text-white">Excel</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 border border-white/10">
              <span className="text-sm font-medium text-white">Google Sheets</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 border border-white/10">
              <span className="text-sm font-medium text-white">QuickBooks</span>
            </div>
          </div>
        </ScrollSection>
      </div>
    </main>
  );
}
