"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${baseUrl || ""}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "Password updated. You can sign in now.");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Invalid or expired link. Request a new reset.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-3 text-sm">
        Missing reset token. Use the link from your email or{" "}
        <Link href={baseUrl ? `${baseUrl}/forgot-password` : "/forgot-password"} className="underline">
          request a new one
        </Link>.
      </div>
    );
  }

  if (status === "success") {
    return (
      <>
        <div className="rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 px-4 py-3 text-sm">
          {message}
        </div>
        <p className="mt-6 text-center">
          <Link
            href={baseUrl ? `${baseUrl}/sign-in` : "/sign-in"}
            className="inline-block bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold rounded-xl px-6 py-2"
          >
            Go to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-slate-300 text-sm font-medium">New password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        required
        minLength={8}
        className="w-full rounded-xl border border-white/20 bg-petroleum/80 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-accent"
      />
      <label className="block text-slate-300 text-sm font-medium">Confirm password</label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Repeat password"
        required
        minLength={8}
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
        {status === "loading" ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] p-8">
        <h1 className="text-xl font-bold text-white mb-1">Reset password</h1>
        <p className="text-slate-400 text-sm mb-6">
          Enter your new password below.
        </p>
        <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
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
