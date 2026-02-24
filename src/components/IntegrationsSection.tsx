"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Plug, Zap, FolderSync, FileSpreadsheet, Link2 } from "lucide-react";
import { MotionScrollSection } from "@/components/MotionScrollSection";

const INTEGRATIONS = [
  {
    name: "QuickBooks",
    icon: Plug,
    description:
      "Absolute Precision: sync any architectural asset—invoices, BOLs, contracts—directly to your books.",
    status: "active" as const,
    connectHref: "/api/quickbooks/auth",
  },
  {
    name: "Zapier",
    icon: Zap,
    description: "Connect to 5,000+ apps automatically.",
    status: "coming_soon" as const,
  },
  {
    name: "Google Drive",
    icon: FolderSync,
    description: "Import and export from Drive.",
    status: "coming_soon" as const,
  },
  {
    name: "Excel Online",
    icon: FileSpreadsheet,
    description: "Open and edit spreadsheets in the cloud.",
    status: "coming_soon" as const,
  },
];

export function IntegrationsSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const [videoInView, setVideoInView] = useState(false);

  useEffect(() => {
    const el = videoWrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const visible = entry.isIntersecting;
        setVideoInView(visible);
        if (visible) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <MotionScrollSection id="integrations" className="mb-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Integrations
        </h2>
        <p className="text-slate-300 text-center text-sm max-w-xl mx-auto mb-8">
          VeloDoc fits into your ecosystem. QuickBooks is live; more integrations are on the way.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {INTEGRATIONS.map(({ name, icon: Icon, description, status, connectHref }) => (
            <div
              key={name}
              className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 flex flex-col items-center text-center shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-accent/20 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-teal-accent" />
              </div>
              <h3 className="font-semibold text-white">{name}</h3>
              <p className="text-slate-400 text-sm mt-1">{description}</p>
              {status === "active" && connectHref ? (
                <>
                  <span className="mt-4 inline-block rounded-full bg-lime-500/20 border border-lime-400/40 px-3 py-1 text-xs font-medium text-lime-300">
                    Active
                  </span>
                  <Link
                    href={connectHref}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-accent hover:bg-teal-accent/90 text-petroleum px-4 py-2.5 text-sm font-semibold transition-colors"
                  >
                    <Link2 className="h-4 w-4" />
                    Connect
                  </Link>
                </>
              ) : (
                <span className="mt-4 inline-block rounded-full bg-petroleum/80 border border-teal-accent/30 px-3 py-1 text-xs font-medium text-teal-accent">
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          ref={videoWrapRef}
          className="mt-12 max-w-2xl mx-auto rounded-2xl border border-white/20 bg-white/[0.07] overflow-hidden border-t-teal-accent/30 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
        >
          <p className="text-center text-slate-400 text-xs font-medium uppercase tracking-wider py-3 border-b border-white/10">
            Live sync in action
          </p>
          <div className="relative aspect-video bg-slate-900/80">
            <video
              ref={videoRef}
              src="/demo.mp4"
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              aria-label="VeloDoc demo: paper-to-digital workflow and sync"
            />
            {videoInView && (
              <p className="absolute bottom-0 left-0 right-0 py-2 px-3 text-center text-xs font-medium text-white/90 bg-gradient-to-t from-black/70 to-transparent">
                Any Paper-to-Digital Workflow → Your books
              </p>
            )}
          </div>
        </div>
      </MotionScrollSection>
    </>
  );
}
