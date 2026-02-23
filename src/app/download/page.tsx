"use client";

import Link from "next/link";
import { Download as DownloadIcon, Monitor, Shield, Zap } from "lucide-react";

const DESKTOP_DOWNLOAD_URL = "/downloads/VeloDoc-Setup.exe";

export default function DownloadPage() {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = DESKTOP_DOWNLOAD_URL;
    link.download = "VeloDoc-Setup.exe";
    link.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <section className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-10 sm:p-14 border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] text-center mb-14">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-teal-accent/20 flex items-center justify-center text-teal-accent">
              <Monitor className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            VeloDoc for Desktop
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Run the AI Architect locally. Process PDFs offline with the same security and accuracy as the cloud.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-3 rounded-lg bg-teal-accent hover:bg-lime-accent text-petroleum px-8 py-4 text-base font-semibold transition-colors shadow-teal-glow"
          >
            <DownloadIcon className="w-6 h-6" aria-hidden />
            Download for PC
          </button>
          <p className="mt-6 text-slate-500 text-sm">
            Windows 10/11 · Requires an active VeloDoc account and credits
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 border-t-teal-accent/30 text-center">
            <Shield className="w-10 h-10 text-teal-accent mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Same security</h2>
            <p className="text-slate-400 text-sm">AES-256 and TLS. Your data never leaves your control.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 border-t-teal-accent/30 text-center">
            <Zap className="w-10 h-10 text-teal-accent mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Offline capable</h2>
            <p className="text-slate-400 text-sm">Process when you&apos;re offline. Sync when you&apos;re back.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 border-t-teal-accent/30 text-center">
            <Monitor className="w-10 h-10 text-teal-accent mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">One account</h2>
            <p className="text-slate-400 text-sm">Use the same credits and dashboard across web and desktop.</p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm">
          Don&apos;t have a VeloDoc account?{" "}
          <Link href="/sign-up" className="text-teal-accent hover:underline font-medium">
            Sign up
          </Link>{" "}
          or{" "}
          <Link href="/" className="text-teal-accent hover:underline font-medium">
            learn more
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
