"use client";

import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";

type PublishedReview = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  reviewer_name: string | null;
  sync_count: number;
  created_at: string;
};

export function TrustedByProfessionals() {
  const [reviews, setReviews] = useState<PublishedReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews/published")
      .then((res) => res.json())
      .then((data: { reviews?: PublishedReview[] }) => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mb-14" aria-label="Trusted by Industry Professionals">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Trusted by Industry Professionals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 border-t-teal-accent/30 animate-pulse"
            >
              <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="mb-14" aria-label="Trusted by Industry Professionals">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        Trusted by Industry Professionals
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(15,23,42,0.4)] border-t-teal-accent/30"
          >
            <Quote className="h-8 w-8 text-teal-accent/60 mb-3" aria-hidden />
            <div className="flex gap-0.5 mb-3" aria-label={`${review.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= review.rating ? "text-teal-accent fill-teal-accent" : "text-slate-600"}`}
                  aria-hidden
                />
              ))}
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{review.comment}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-teal-accent">
              {review.reviewer_name || "VeloDoc Professional"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {review.sync_count} successful sync{review.sync_count !== 1 ? "s" : ""} • Absolute Precision
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
