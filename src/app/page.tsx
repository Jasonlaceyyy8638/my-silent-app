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
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Testimonials } from "@/components/Testimonials";
import { TrustBar } from "@/components/TrustBar";
import { CaseStudies } from "@/components/CaseStudies";
import { MotionScrollSection } from "@/components/MotionScrollSection";
import { HeroCinematic } from "@/components/HeroCinematic";
import { ComparisonSection } from "@/components/ComparisonSection";
import { FeaturesBento } from "@/components/FeaturesBento";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { TemplatesGallery } from "@/components/TemplatesGallery";
import { SignupSection } from "@/components/SignupSection";
import { AboutSection } from "@/components/AboutSection";
import { IntegrationsSection } from "@/components/IntegrationsSection";

type Plan = "starter" | "pro" | "enterprise";

const PRICING_TIERS: { plan: Plan; name: string; price: string; automationLimit: string; description: string; cta: "checkout" | "contact" }[] = [
  {
    plan: "starter",
    name: "Starter",
    price: "$9",
    automationLimit: "0 automations/month",
    description: "Manual PDF processing only. Perfect for trying VeloDoc.",
    cta: "checkout",
  },
  {
    plan: "pro",
    name: "Pro",
    price: "$49",
    automationLimit: "50 automations/month",
    description: "QuickBooks bridge + automated weekly CSV report. For growing teams.",
    cta: "checkout",
  },
  {
    plan: "enterprise",
    name: "Enterprise",
    price: "Custom",
    automationLimit: "Unlimited automations",
    description: "Full access, dedicated support, and custom limits.",
    cta: "contact",
  },
];

export default function Home() {
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = useCallback(async (plan: Plan) => {
    setError(null);
    setCheckoutPlan(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setCheckoutPlan(null);
    }
  }, []);

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
      description: "Architect BOLs, rate confirmations, and shipping documents.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-teal-950/30">
      <HeroCinematic />

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <MotionScrollSection className="mb-14">
          <TrustBar />
        </MotionScrollSection>

        <MotionScrollSection className="mb-14 rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 border-t-teal-accent/30">
          <p className="text-center text-slate-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            <span className="text-white font-semibold">What it does:</span> VeloDoc is the Enterprise-Grade Universal Data Engine—turning any PDF into structured data with nationwide compliance. QuickBooks, Sheets, Slack, and more.
          </p>
        </MotionScrollSection>

        <MotionScrollSection className="mb-14">
          <ComparisonSection />
        </MotionScrollSection>

        <SignupSection />

        <MotionScrollSection className="mb-14">
          <IndustrySwitcher />
        </MotionScrollSection>

        <MotionScrollSection className="mb-14">
          <TemplatesGallery />
        </MotionScrollSection>

        <MotionScrollSection className="mb-14">
          <AboutSection />
        </MotionScrollSection>

        <MotionScrollSection className="mb-14">
          <FeaturesBento />
        </MotionScrollSection>

        <MotionScrollSection className="flex justify-center mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl justify-items-center">
            <div className="flex flex-col items-center text-center p-5 rounded-xl bg-white/5 border border-white/10 w-full max-w-[260px]">
              <FileUp className="h-10 w-10 text-teal-accent mb-3" />
              <h3 className="font-semibold text-white">Upload</h3>
              <p className="text-sm text-slate-300 mt-2">
                BOLs, contracts, forms—any document type.
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
        </MotionScrollSection>

        <MotionScrollSection className="mb-14">
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
        </MotionScrollSection>

        <MotionScrollSection className="mb-14">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Quantified Wins
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 text-center border-t-teal-accent/30">
              <p className="text-4xl sm:text-5xl font-extrabold text-teal-accent tabular-nums">2M+</p>
              <p className="text-slate-300 font-medium mt-2">Documents Processed</p>
              <p className="text-slate-500 text-sm mt-1">Enterprise-grade, nationwide</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-8 text-center border-t-teal-accent/30">
              <p className="text-4xl sm:text-5xl font-extrabold text-teal-accent tabular-nums">500K+</p>
              <p className="text-slate-300 font-medium mt-2">Hours Saved</p>
              <p className="text-slate-500 text-sm mt-1">Universal Data Engine at scale</p>
            </div>
          </div>
        </MotionScrollSection>

        <MotionScrollSection>
          <CaseStudies />
        </MotionScrollSection>

        <MotionScrollSection>
          <Testimonials />
        </MotionScrollSection>

        <MotionScrollSection className="mb-14 text-center">
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
        </MotionScrollSection>

        <MotionScrollSection id="pricing" className="mb-14 scroll-mt-24">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Monthly subscription
          </h2>
          <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-8">
            Three tiers with automation limits. Upgrade anytime.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING_TIERS.map(({ plan, name, price, automationLimit, description, cta }) => (
              <div
                key={plan}
                className={`rounded-2xl border backdrop-blur-xl p-6 flex flex-col shadow-[0_8px_32px_rgba(15,23,42,0.4)] ${
                  plan === "pro"
                    ? "border-[#22d3ee]/40 bg-[#22d3ee]/5 border-t-[#22d3ee]/50 relative"
                    : "border-white/20 bg-white/[0.07] border-t-teal-accent/30"
                }`}
              >
                {plan === "pro" && (
                  <span className="absolute -top-2.5 right-6 rounded-full bg-[#22d3ee]/20 border border-[#22d3ee]/40 px-2.5 py-0.5 text-[10px] font-medium text-[#22d3ee] uppercase tracking-wider">
                    Popular
                  </span>
                )}
                <span className={`text-[10px] font-mono uppercase tracking-wider ${plan === "pro" ? "text-[#22d3ee]" : "text-slate-500"}`}>
                  {plan}
                </span>
                <h3 className="text-lg font-semibold text-white mt-0.5">{name}</h3>
                <p className="mt-1 text-3xl font-bold text-white">{price}</p>
                <p className="text-slate-300 text-sm mt-1 font-medium">{automationLimit}</p>
                <p className="text-slate-400 text-sm mt-2 flex-1">{description}</p>
                {cta === "checkout" ? (
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan)}
                    disabled={checkoutPlan !== null}
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none transition-colors ${
                      plan === "pro"
                        ? "bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-petroleum"
                        : "bg-teal-accent hover:bg-lime-accent text-petroleum"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {checkoutPlan === plan ? "Redirecting…" : plan === "starter" ? "Get Starter" : "Get Pro"}
                  </button>
                ) : (
                  <a
                    href="mailto:sales@velodoc.app?subject=Enterprise%20plan%20inquiry"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 text-sm font-medium transition-colors"
                  >
                    Contact Sales
                  </a>
                )}
              </div>
            ))}
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-300 text-center" role="alert">
              {error}
            </p>
          )}
        </MotionScrollSection>

        <IntegrationsSection />

        <MotionScrollSection className="text-center">
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
        </MotionScrollSection>
      </div>
    </main>
  );
}
