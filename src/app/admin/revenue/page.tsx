"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueDay {
  date: string;
  revenue: number;
}

interface PlanRevenue {
  plan_id: string;
  count: number;
  total_revenue?: number;
}

const PLAN_DISPLAY: Record<string, string> = {
  free: "Free",
  monthly: "Pro ($20/mo — 50k credits)",
  studio: "Studio ($70/mo — 75k credits)",
  enterprise: "Enterprise (custom)",
};
const formatPlanName = (id: string) => PLAN_DISPLAY[id] || id;

export default function AdminRevenuePage() {
  const [daily, setDaily] = useState<RevenueDay[]>([]);
  const [plans, setPlans] = useState<PlanRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/admin/revenue");
        if (res.ok) {
          const data = await res.json();
          setDaily(data.daily || data);
          if (data.planDistribution) setPlans(data.planDistribution);
        }
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchRevenue();
  }, []);

  const monthlyTotal = daily.reduce((sum, d) => sum + d.revenue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg
          className="w-8 h-8 text-accent animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Revenue Analytics</h1>
        <div className="bg-surface border border-border rounded-xl px-5 py-3">
          <div className="text-sm text-muted">Monthly Total</div>
          <div className="text-2xl font-bold text-success">
            $
            {monthlyTotal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Daily Revenue</h2>
        {daily.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ba3a8", fontSize: 12 }}
                  axisLine={{ stroke: "#2d2d3f" }}
                  tickLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fill: "#9ba3a8", fontSize: 12 }}
                  axisLine={{ stroke: "#2d2d3f" }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a24",
                    border: "1px solid #2d2d3f",
                    borderRadius: "8px",
                    color: "#e8e6e3",
                  }}
                  formatter={(value: unknown) => [
                    `$${Number(value || 0).toFixed(2)}`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6c5ce7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#a29bfe" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted">
            No revenue data available
          </div>
        )}
      </div>

      {/* Plan Breakdown */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Plan Breakdown</h2>
        {plans.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.plan_id}
                className="bg-surface-light border border-border rounded-lg p-5"
              >
                <div className="text-base font-semibold mb-2">
                  {formatPlanName(plan.plan_id)}
                </div>
                <div className="flex items-baseline gap-4">
                  <div>
                    <div className="text-2xl font-bold text-accent-light">
                      {plan.count}
                    </div>
                    <div className="text-sm text-muted">subscribers</div>
                  </div>
                  {plan.total_revenue !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-success">
                        $
                        {plan.total_revenue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-sm text-muted">total revenue</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted text-center py-8">
            No plan data available
          </div>
        )}
      </div>
    </div>
  );
}
