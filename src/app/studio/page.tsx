"use client";

import { useState, useEffect, useCallback } from "react";

interface EarningsData {
  totalEarnings: number;
  periodEarnings: number;
  streams: Record<string, number>;
  transactions: { date: string; description: string; amount: number; type: string }[];
  analytics: {
    totalSessions: number;
    mostRehearsed: string;
    consistencyScore: number;
    fanGrowth: number;
    subscriberChurn: number;
    contentViews: number;
  };
}

export default function StudioDashboardPage() {
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/earnings?range=${timeRange}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const streamColors: Record<string, string> = {
    masterclass: "bg-accent",
    pass: "bg-success",
    delivery: "bg-warning",
    voiceLicensing: "bg-danger",
    coaching: "bg-accent-light",
  };

  const streamLabels: Record<string, string> = {
    masterclass: "Masterclass Sales",
    pass: "PASS Subscriptions",
    delivery: "Client Deliveries",
    voiceLicensing: "Voice Licensing",
    coaching: "Coaching Sessions",
  };

  const totalFromStreams = data ? Object.values(data.streams).reduce((a, b) => a + b, 0) : 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-muted">
        Unable to load earnings data. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Line Runner STUDIO</h1>
          <p className="text-muted mt-1 text-sm sm:text-base">Your complete creative business dashboard</p>
        </div>
        <div className="flex bg-surface border border-border rounded-xl p-1 self-start sm:self-auto">
          {(["month", "quarter", "year"] as const).map((t) => (
            <button key={t} onClick={() => setTimeRange(t)} className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${timeRange === t ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Total Earnings</div>
          <div className="text-2xl sm:text-3xl font-bold text-success">${data.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">This {timeRange === "month" ? "Month" : timeRange === "quarter" ? "Quarter" : "Year"}</div>
          <div className="text-2xl sm:text-3xl font-bold text-accent-light">${data.periodEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Fan Growth</div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">+{data.analytics.fanGrowth}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Content Views</div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">{data.analytics.contentViews.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings by Stream */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Earnings by Stream</h2>
          {totalFromStreams === 0 ? (
            <div className="py-8 text-center text-muted">
              No earnings yet this period. Start selling masterclasses, PASS memberships, or client deliveries to see data here.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(data.streams).map(([key, value]) => {
                const percent = totalFromStreams > 0 ? (value / totalFromStreams) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm">{streamLabels[key] || key}</span>
                      <span className="text-sm font-semibold">${value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                      <div className={`h-full ${streamColors[key] || "bg-accent"} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payout Info */}
          <div className="mt-6 bg-success/10 border border-success/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-success">Next Payout</div>
              <div className="text-xs text-muted">Processed via Manifest Financial on the 1st of each month</div>
            </div>
            <div className="text-xl font-bold text-success">${data.periodEarnings.toFixed(2)}</div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Session Analytics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Total Sessions</span>
                <span className="font-semibold">{data.analytics.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Most Rehearsed</span>
                <span className="font-semibold text-sm text-right max-w-[160px] truncate">{data.analytics.mostRehearsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Consistency Score</span>
                <span className="font-semibold text-success">{data.analytics.consistencyScore}%</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Profile Analytics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Active Fans</span>
                <span className="font-semibold text-success">{data.analytics.fanGrowth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Content Views</span>
                <span className="font-semibold">{data.analytics.contentViews}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Recent Transactions</h2>
        </div>
        {data.transactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted">
            No transactions yet. Earnings from masterclasses, PASS subscriptions, client deliveries, voice licensing, and coaching will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-muted font-medium">Date</th>
                  <th className="text-left py-3 px-6 text-muted font-medium">Description</th>
                  <th className="text-left py-3 px-6 text-muted font-medium">Type</th>
                  <th className="text-right py-3 px-6 text-muted font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-6 text-muted">{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="py-3 px-6">{tx.description}</td>
                    <td className="py-3 px-6"><span className={`text-xs px-2 py-0.5 rounded ${streamColors[tx.type] || "bg-accent"} text-white`}>{tx.type}</span></td>
                    <td className="py-3 px-6 text-right font-semibold text-success">${tx.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
