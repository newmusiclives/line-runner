"use client";

import { useState } from "react";

export default function StudioDashboardPage() {
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");

  // Mock data for the STUDIO dashboard
  const earnings = {
    total: 2847.50,
    monthly: 847.50,
    streams: {
      masterclass: 425.00,
      pass: 180.00,
      delivery: 1842.50,
      voiceLicensing: 275.00,
      coaching: 125.00,
    },
  };

  const analytics = {
    totalSessions: 156,
    mostRehearsed: "Death of a Salesman",
    consistencyScore: 87,
    fanGrowth: 23,
    subscriberChurn: 2.1,
    contentViews: 1240,
  };

  const recentTransactions = [
    { date: "2026-03-28", description: "Masterclass purchase — Lady Macbeth", amount: 12.75, type: "masterclass" },
    { date: "2026-03-27", description: "PASS subscription — Tier 2", amount: 7.65, type: "pass" },
    { date: "2026-03-25", description: "Client delivery — Pharma narration", amount: 485.00, type: "delivery" },
    { date: "2026-03-22", description: "Voice licensing royalty", amount: 34.50, type: "voiceLicensing" },
    { date: "2026-03-20", description: "Masterclass purchase — Commercial VO", amount: 10.20, type: "masterclass" },
    { date: "2026-03-18", description: "PASS subscription — Tier 1", amount: 2.55, type: "pass" },
    { date: "2026-03-15", description: "Client delivery — E-learning module", amount: 220.00, type: "delivery" },
  ];

  const streamColors: Record<string, string> = {
    masterclass: "bg-accent",
    pass: "bg-success",
    delivery: "bg-warning",
    voiceLicensing: "bg-danger",
    coaching: "bg-accent-light",
  };

  const totalFromStreams = Object.values(earnings.streams).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Line Runner STUDIO</h1>
          <p className="text-muted mt-1">Your complete creative business dashboard</p>
        </div>
        <div className="flex bg-surface border border-border rounded-xl p-1">
          {(["month", "quarter", "year"] as const).map((t) => (
            <button key={t} onClick={() => setTimeRange(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${timeRange === t ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Total Earnings</div>
          <div className="text-3xl font-bold text-success">${earnings.total.toLocaleString()}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">This Month</div>
          <div className="text-3xl font-bold text-accent-light">${earnings.monthly.toLocaleString()}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Fan Growth</div>
          <div className="text-3xl font-bold text-foreground">+{analytics.fanGrowth}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Content Views</div>
          <div className="text-3xl font-bold text-foreground">{analytics.contentViews.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings by Stream */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Earnings by Stream</h2>
          <div className="space-y-4">
            {Object.entries(earnings.streams).map(([key, value]) => {
              const percent = (value / totalFromStreams) * 100;
              const labels: Record<string, string> = {
                masterclass: "Masterclass Sales",
                pass: "PASS Subscriptions",
                delivery: "Client Deliveries",
                voiceLicensing: "Voice Licensing",
                coaching: "Coaching Sessions",
              };
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm">{labels[key]}</span>
                    <span className="text-sm font-semibold">${value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                    <div className={`h-full ${streamColors[key]} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payout Info */}
          <div className="mt-6 bg-success/10 border border-success/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-success">Next Payout</div>
              <div className="text-xs text-muted">Processed via Stripe on the 1st of each month</div>
            </div>
            <div className="text-xl font-bold text-success">${earnings.monthly.toFixed(2)}</div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Session Analytics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Total Sessions</span>
                <span className="font-semibold">{analytics.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Most Rehearsed</span>
                <span className="font-semibold text-sm text-right max-w-[160px] truncate">{analytics.mostRehearsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Consistency Score</span>
                <span className="font-semibold text-success">{analytics.consistencyScore}%</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Profile Analytics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Fan Growth (30d)</span>
                <span className="font-semibold text-success">+{analytics.fanGrowth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Subscriber Churn</span>
                <span className="font-semibold text-warning">{analytics.subscriberChurn}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Content Views</span>
                <span className="font-semibold">{analytics.contentViews}</span>
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
              {recentTransactions.map((tx, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3 px-6 text-muted">{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="py-3 px-6">{tx.description}</td>
                  <td className="py-3 px-6"><span className={`text-xs px-2 py-0.5 rounded ${streamColors[tx.type]} text-white`}>{tx.type}</span></td>
                  <td className="py-3 px-6 text-right font-semibold text-success">${tx.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
