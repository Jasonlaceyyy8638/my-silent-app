"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, DollarSign } from "lucide-react";
import type { RevenueResponse } from "@/app/api/admin/revenue/route";

const CARD_CLASS =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function RevenueLineChart({
  trend,
  maxAmount,
  chartHeight,
}: {
  trend: Array<{ date: string; amount: number }>;
  maxAmount: number;
  chartHeight: number;
}) {
  const width = Math.max(trend.length * 8, 200);
  const points = trend.map((d, i) => {
    const x = trend.length <= 1 ? 0 : (i / (trend.length - 1)) * width;
    const y = chartHeight - (d.amount / maxAmount) * (chartHeight - 8) - 4;
    return { x, y };
  });
  const linePath =
    points.length >= 2
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";
  const areaPath =
    points.length >= 2
      ? `${linePath} L ${width} ${chartHeight} L 0 ${chartHeight} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${chartHeight}`}
      className="min-w-full h-[120px] text-teal-accent"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="tealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && (
        <path d={areaPath} fill="url(#tealGradient)" />
      )}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function RevenueOverview() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/revenue")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body.error) {
          setError(body.error);
          setData({ weekly: 0, monthly: 0, yearly: 0, trend: [] });
        } else {
          setData({
            weekly: body.weekly ?? 0,
            monthly: body.monthly ?? 0,
            yearly: body.yearly ?? 0,
            trend: Array.isArray(body.trend) ? body.trend : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load revenue");
          setData({ weekly: 0, monthly: 0, yearly: 0, trend: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className={CARD_CLASS + " p-6"}>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-teal-accent" />
          Revenue Overview
        </h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-accent" />
        </div>
      </section>
    );
  }

  const trend = data?.trend ?? [];
  const maxAmount = Math.max(1, ...trend.map((d) => d.amount));
  const chartHeight = 120;

  return (
    <section className={CARD_CLASS + " p-4 sm:p-6"}>
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 sm:mb-6">
        <DollarSign className="h-5 w-5 text-teal-accent" />
        Revenue Overview
      </h2>
      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="rounded-xl border border-teal-accent/20 bg-teal-accent/5 p-4">
          <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">
            Weekly
          </p>
          <p className="text-teal-accent text-xl sm:text-2xl font-bold tabular-nums">
            {formatCurrency(data?.weekly ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-teal-accent/20 bg-teal-accent/5 p-4">
          <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">
            Monthly
          </p>
          <p className="text-teal-accent text-xl sm:text-2xl font-bold tabular-nums">
            {formatCurrency(data?.monthly ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-teal-accent/20 bg-teal-accent/5 p-4">
          <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">
            Yearly
          </p>
          <p className="text-teal-accent text-xl sm:text-2xl font-bold tabular-nums">
            {formatCurrency(data?.yearly ?? 0)}
          </p>
        </div>
      </div>
      {trend.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-accent" />
            Revenue trend
          </p>
          <div
            className="w-full overflow-x-auto -mx-1"
            style={{ minHeight: chartHeight }}
          >
            <RevenueLineChart
              trend={trend}
              maxAmount={maxAmount}
              chartHeight={chartHeight}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-slate-500">
            <span>{trend[0]?.date ?? ""}</span>
            <span>{trend[trend.length - 1]?.date ?? ""}</span>
          </div>
        </div>
      ) : (
        <p className="text-slate-500 text-sm py-4 text-center">
          No revenue data in the last year.
        </p>
      )}
    </section>
  );
}
