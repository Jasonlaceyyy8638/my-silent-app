"use client";

import { useState } from "react";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${baseUrl || ""}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "If an account exists, you will receive a reset link.");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] p-8">
        <h1 className="text-xl font-bold text-white mb-1">Forgot password</h1>
        <p className="text-slate-400 text-sm mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        {status === "success" ? (
          <div className="rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 px-4 py-3 text-sm">
            {message}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-slate-300 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-white/20 bg-petroleum/80 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
            {status === "error" && message && (
              <p className="text-red-400 text-sm">{message}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold rounded-xl py-3 disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center">
          <Link
            href={baseUrl ? `${baseUrl}/sign-in` : "/sign-in"}
            className="text-teal-accent hover:text-teal-300 text-sm"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
