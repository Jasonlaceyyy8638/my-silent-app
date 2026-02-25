"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = (params?.id as string) ?? "";
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setStatus("error");
      setMessage("Invalid review link.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setStatus("error");
      setMessage("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      setStatus("error");
      setMessage("Please write at least 10 characters for your testimonial.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${APP_URL || ""}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          rating,
          comment: comment.trim(),
          reviewer_name: reviewerName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setMessage((data as { message?: string }).message ?? "Thank you for your review.");
      } else {
        setStatus("error");
        setMessage((data as { error?: string }).error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center p-4">
        <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-white">Invalid link</h1>
          <p className="text-slate-400 mt-2">This review link is invalid or expired.</p>
          <Link href={APP_URL || "/"} className="inline-block mt-6 text-teal-accent hover:text-teal-300 text-sm">
            Go to VeloDoc
          </Link>
        </div>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center p-4">
        <div className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 p-8 text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-teal-accent/20 flex items-center justify-center mx-auto mb-4">
            <Star className="h-7 w-7 text-teal-accent fill-teal-accent" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-white">Thank you</h1>
          <p className="text-slate-300 mt-2">{message}</p>
          <Link
            href={APP_URL ? `${APP_URL}/dashboard` : "/dashboard"}
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-teal-accent text-petroleum font-semibold hover:bg-teal-accent/90"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-petroleum via-slate-900 to-petroleum flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)] p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Share your experience</h1>
          <p className="text-slate-400 text-sm mt-1">Absolute Precision — your feedback helps us improve.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-1 justify-center sm:justify-start" role="group" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-teal-accent focus:ring-offset-2 focus:ring-offset-[#0f172a]"
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  aria-pressed={rating === value}
                >
                  <Star
                    className={`h-9 w-9 sm:h-10 sm:w-10 transition-colors ${
                      value <= (hoverRating || rating) ? "text-teal-accent fill-teal-accent" : "text-slate-500"
                    }`}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="review-comment" className="block text-slate-300 text-sm font-medium mb-2">
              Testimonial
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with VeloDoc..."
              required
              minLength={10}
              rows={4}
              className="w-full rounded-xl border border-white/20 bg-petroleum/80 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-accent resize-none"
            />
            <p className="text-slate-500 text-xs mt-1">At least 10 characters.</p>
          </div>
          <div>
            <label htmlFor="reviewer-name" className="block text-slate-300 text-sm font-medium mb-2">
              Your name <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              id="reviewer-name"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Alex from Acme Co."
              className="w-full rounded-xl border border-white/20 bg-petroleum/80 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>
          {status === "error" && message && (
            <p className="text-red-400 text-sm" role="alert">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3.5 rounded-xl bg-teal-accent text-petroleum font-semibold hover:bg-teal-accent/90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-teal-accent focus:ring-offset-2 focus:ring-offset-[#0f172a]"
          >
            {status === "loading" ? "Submitting…" : "Submit review"}
          </button>
        </form>
        <p className="text-center text-slate-500 text-xs mt-6">
          <Link href={APP_URL || "/"} className="text-teal-accent/80 hover:text-teal-accent">
            Back to VeloDoc
          </Link>
        </p>
      </div>
    </main>
  );
}
