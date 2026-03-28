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

interface DashboardData {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
  scriptsUploaded: number;
  avgSessionDuration: number;
  newUsersThisWeek: number;
  totalSessions: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
}

interface PlanDist {
  plan_id: string;
  count: number;
}

const formatPlanName = (id: string) =>
  id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDay[]>([]);
  const [planDist, setPlanDist] = useState<PlanDist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [dashRes, revRes] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/admin/revenue"),
        ]);
        if (dashRes.ok) {
          const data = await dashRes.json();
          setKpis(data.kpis || data);
          if (data.planDistribution) setPlanDist(data.planDistribution);
        }
        if (revRes.ok) {
          const data = await revRes.json();
          setRevenueData(data.daily || data);
          if (data.planDistribution) setPlanDist(data.planDistribution);
        }
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

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
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Users",
            value: kpis?.totalUsers ?? 0,
            color: "text-accent-light",
          },
          {
            label: "Active Subscriptions",
            value: kpis?.activeSubscriptions ?? 0,
            color: "text-success",
          },
          {
            label: "Monthly Revenue",
            value: `$${(kpis?.monthlyRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: "text-success",
          },
          {
            label: "Scripts Uploaded",
            value: kpis?.scriptsUploaded ?? 0,
            color: "text-accent-light",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="text-sm text-muted mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Revenue (Last 30 Days)</h2>
        {revenueData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
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
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
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
          <div className="h-72 flex items-center justify-center text-muted">
            No revenue data available
          </div>
        )}
      </div>

      {/* Plan Distribution */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Plan Distribution</h2>
        {planDist.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {planDist.map((plan) => (
              <div
                key={plan.plan_id}
                className="bg-surface-light border border-border rounded-lg p-4"
              >
                <div className="text-sm text-muted mb-1">
                  {formatPlanName(plan.plan_id)}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {plan.count}
                </div>
                <div className="text-sm text-muted">
                  active subscription{plan.count !== 1 ? "s" : ""}
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
