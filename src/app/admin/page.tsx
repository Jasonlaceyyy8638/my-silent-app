"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Search,
  Check,
  Loader2,
  Users,
  MessageSquare,
  RefreshCw,
  Gift,
} from "lucide-react";
import type { AdminProfile, AdminReview } from "@/app/api/admin/dashboard/route";
import { RevenueOverview } from "@/components/admin/RevenueOverview";

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

export default function AdminPage() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creditAdjustments, setCreditAdjustments] = useState<Record<string, string>>({});
  const [creditModes, setCreditModes] = useState<Record<string, "add" | "reset">>({});
  const [reimburseAmounts, setReimburseAmounts] = useState<Record<string, string>>({});
  const [reimburseReasons, setReimburseReasons] = useState<Record<string, string>>({});
  const [savingCredits, setSavingCredits] = useState<string | null>(null);
  const [reimbursingId, setReimbursingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load dashboard");
        setProfiles([]);
        setReviews([]);
        return;
      }
      setProfiles(data.profiles ?? []);
      setReviews(data.reviews ?? []);
      const modes: Record<string, "add" | "reset"> = {};
      for (const p of data.profiles ?? []) {
        modes[p.user_id] = "add";
      }
      setCreditModes(modes);
      setCreditAdjustments({});
    } catch (e) {
      setError("Failed to load dashboard");
      setProfiles([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.user_id ?? "").toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateCredits = async (userId: string) => {
    const raw = creditAdjustments[userId] ?? "";
    const value = parseInt(raw, 10);
    const mode = creditModes[userId] ?? "add";
    if (raw.trim() === "" || Number.isNaN(value) || (mode === "reset" && value < 0) || (mode === "add" && value < 0)) {
      showToast("Enter a valid non-negative number.", "error");
      return;
    }
    setSavingCredits(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/profiles/credits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, mode, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update credits");
        showToast(data.error ?? "Failed to update credits", "error");
        return;
      }
      const newTotal = data.credits_remaining ?? data.profile?.credits_remaining ?? value;
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === userId ? { ...p, credits_remaining: newTotal } : p
        )
      );
      setCreditAdjustments((prev) => ({ ...prev, [userId]: "" }));
      showToast("Credits updated successfully. Confirmation email sent to user if on file.", "success");
    } catch {
      setError("Failed to update credits");
      showToast("Failed to update credits", "error");
    } finally {
      setSavingCredits(null);
    }
  };

  const handleReimburse = async (userId: string) => {
    const amountRaw = reimburseAmounts[userId] ?? "";
    const amount = parseInt(amountRaw, 10);
    const reason = (reimburseReasons[userId] ?? "").trim();
    if (!amountRaw.trim() || Number.isNaN(amount) || amount < 1) {
      showToast("Enter a positive amount.", "error");
      return;
    }
    if (!reason) {
      showToast("Enter a reason (e.g. System Error, Loyalty Bonus).", "error");
      return;
    }
    setReimbursingId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/profiles/reimburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to reimburse");
        showToast(data.error ?? "Failed to reimburse", "error");
        return;
      }
      const newTotal = data.credits_remaining;
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === userId ? { ...p, credits_remaining: newTotal } : p
        )
      );
      setReimburseAmounts((prev) => ({ ...prev, [userId]: "" }));
      setReimburseReasons((prev) => ({ ...prev, [userId]: "" }));
      showToast("Credits reimbursed. Logged and confirmation email sent.", "success");
    } catch {
      setError("Failed to reimburse");
      showToast("Failed to reimburse", "error");
    } finally {
      setReimbursingId(null);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    setApprovingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to approve review");
        return;
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, is_published: true } : r
        )
      );
    } catch {
      setError("Failed to approve review");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-teal-950/30 text-zinc-100">
      <header className="border-b border-white/20 sticky top-0 z-10 bg-petroleum/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-teal-accent/90 hover:text-teal-accent transition-colors min-h-[44px] items-center touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
          <div className="flex items-center gap-2 text-teal-accent">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Admin Dashboard
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-xl sm:text-3xl font-bold text-white mb-2">
          Absolute Precision
        </h1>
        <p className="text-slate-400 text-sm mb-6 sm:mb-8">
          Revenue, credit management, and reviews. VeloDoc admin.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {toast && (
          <div
            role="alert"
            className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg touch-manipulation ${
              toast.type === "success"
                ? "border-teal-accent/30 bg-teal-accent/10 text-teal-accent"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {toast.type === "success" && <Check className="inline h-4 w-4 mr-2 align-middle" />}
            {toast.message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-accent" />
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-10">
            <RevenueOverview />

            {/* Profiles + Search */}
            <section className={CARD_CLASS + " p-4 sm:p-6 overflow-hidden"}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-accent" />
                  Profiles
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-accent/50"
                  />
                </div>
              </div>
              <div className="overflow-x-auto -mx-2 overflow-y-visible">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/20 text-left text-slate-400">
                      <th className="py-3 px-2 font-medium">Email</th>
                      <th className="py-3 px-2 font-medium">Plan</th>
                      <th className="py-3 px-2 font-medium">Credits</th>
                      <th className="py-3 px-2 font-medium">Reimburse</th>
                      <th className="py-3 px-2 font-medium hidden md:table-cell">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((p) => (
                      <tr
                        key={p.user_id}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="py-3 px-2 text-white break-all">
                          {p.email ?? p.user_id}
                        </td>
                        <td className="py-3 px-2 text-teal-accent/90">
                          {p.plan_type}
                        </td>
                        <td className="py-3 px-2 text-slate-300">
                          {p.credits_remaining ?? "—"}
                        </td>
                        <td className="py-3 px-2 align-top">
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                placeholder="Amount"
                                value={reimburseAmounts[p.user_id] ?? ""}
                                onChange={(e) =>
                                  setReimburseAmounts((prev) => ({
                                    ...prev,
                                    [p.user_id]: e.target.value,
                                  }))
                                }
                                className="w-16 sm:w-20 px-2 py-2 sm:py-1.5 rounded-lg border border-white/20 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-accent/50 text-sm min-h-[44px] sm:min-h-0"
                              />
                              <button
                                type="button"
                                onClick={() => handleReimburse(p.user_id)}
                                disabled={reimbursingId === p.user_id}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-teal-accent text-petroleum font-semibold px-3 py-2 sm:py-1.5 text-xs hover:bg-teal-accent/90 disabled:opacity-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                              >
                                {reimbursingId === p.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Gift className="h-4 w-4" />
                                )}
                                Reimburse
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Reason (e.g. System Error, Loyalty Bonus)"
                              value={reimburseReasons[p.user_id] ?? ""}
                              onChange={(e) =>
                                setReimburseReasons((prev) => ({
                                  ...prev,
                                  [p.user_id]: e.target.value,
                                }))
                              }
                              className="w-full px-2 py-2 sm:py-1.5 rounded-lg border border-white/20 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-accent/50 text-xs min-h-[44px] sm:min-h-0"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-2 align-top hidden md:table-cell">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              placeholder={creditModes[p.user_id] === "reset" ? "New total" : "Amt"}
                              value={creditAdjustments[p.user_id] ?? ""}
                              onChange={(e) =>
                                setCreditAdjustments((prev) => ({
                                  ...prev,
                                  [p.user_id]: e.target.value,
                                }))
                              }
                              className="w-16 px-2 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-accent/50"
                            />
                            <select
                              value={creditModes[p.user_id] ?? "add"}
                              onChange={(e) =>
                                setCreditModes((prev) => ({
                                  ...prev,
                                  [p.user_id]: e.target.value as "add" | "reset",
                                }))
                              }
                              className="px-2 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-teal-accent/50 text-xs"
                            >
                              <option value="add">Add</option>
                              <option value="reset">Reset</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleUpdateCredits(p.user_id)}
                              disabled={savingCredits === p.user_id}
                              className="inline-flex items-center gap-1 rounded-lg bg-teal-accent/20 text-teal-accent hover:bg-teal-accent/30 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                            >
                              {savingCredits === p.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProfiles.length === 0 && (
                <p className="py-8 text-center text-slate-500 text-sm">
                  {search.trim() ? "No profiles match your search." : "No profiles yet."}
                </p>
              )}
            </section>

            {/* Reviews */}
            <section className={CARD_CLASS + " p-6"}>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-teal-accent" />
                Reviews
              </h2>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium mb-1">
                          {r.reviewer_name ?? "Anonymous"}
                        </p>
                        <p className="text-slate-300 text-sm mb-2 line-clamp-2">
                          {r.comment}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Rating: {r.rating}/5</span>
                          <span>
                            {r.is_published ? (
                              <span className="text-teal-accent flex items-center gap-1">
                                <Check className="h-3 w-3" /> Published
                              </span>
                            ) : (
                              "Unpublished"
                            )}
                          </span>
                        </div>
                      </div>
                      {!r.is_published && (
                        <button
                          type="button"
                          onClick={() => handleApproveReview(r.id)}
                          disabled={approvingId === r.id}
                          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-teal-accent text-petroleum font-semibold px-4 py-2.5 sm:py-2 text-sm hover:bg-teal-accent/90 disabled:opacity-50 min-h-[44px] touch-manipulation"
                        >
                          {approvingId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {reviews.length === 0 && (
                <p className="py-8 text-center text-slate-500 text-sm">
                  No reviews yet.
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
