"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PRICING_PLANS } from "@/lib/manifest-financial";

interface SubscriptionData {
  planId: string;
  planName: string;
  status: string;
  minutesUsed: number;
  minutesIncluded: number;
  currentPeriodEnd: string;
}

interface SubCheck {
  tier: string;
  active: boolean;
  minutesUsed: number;
  minutesIncluded: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

type PlanFeature = { text: string; soon?: boolean };

interface DisplayPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  minutes: number;
  features: PlanFeature[];
  popular?: boolean;
}

// Curated feature list for the dashboard comparison grid. Price + minutes are
// pulled from PRICING_PLANS (manifest-financial.ts) so they can't drift.
const PLAN_DISPLAY: Record<string, { features: PlanFeature[]; popular?: boolean }> = {
  free: {
    features: [
      { text: "Full demo library (no signup)" },
      { text: "1 personal script upload" },
      { text: "Script analysis on upload" },
      { text: "Line Memory Tracker" },
      { text: "Standard rehearsal mode" },
      { text: "Teleprompter + Bookmarks" },
    ],
  },
  monthly: {
    popular: true,
    features: [
      { text: "Everything in Free" },
      { text: "Unlimited scene runs and uploads" },
      { text: "All 10 rehearsal modes" },
      { text: "AI Performance Coach" },
      { text: "Self-Tape Studio (1080p)" },
      { text: "Full voice customisation (10 voices)" },
      { text: "Buy credit blocks anytime" },
    ],
  },
  studio: {
    features: [
      { text: "Everything in Pro" },
      { text: "25 AI voices per script" },
      { text: "VO Professional Suite (10 tools)" },
      { text: "Demo Reel Producer" },
      { text: "Client Delivery Portal" },
      { text: "Voice Print Builder" },
      { text: "STUDIO Business Dashboard" },
    ],
  },
};

function buildPlans(): DisplayPlan[] {
  return PRICING_PLANS.filter((p) => p.id !== "free" ? true : true).map((p) => ({
    id: p.id,
    name: p.name,
    price: `$${p.price}`,
    period: p.id === "free" ? "forever" : "/month",
    minutes: p.maxMinutes,
    features: PLAN_DISPLAY[p.id]?.features ?? [],
    popular: PLAN_DISPLAY[p.id]?.popular,
  }));
}

function getFreeMinutes(): number {
  return PRICING_PLANS.find((p) => p.id === "free")?.maxMinutes ?? 5;
}

export default function SubscriptionPage() {
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [subCheck, setSubCheck] = useState<SubCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const PLANS = useMemo(() => buildPlans(), []);
  const FREE_MINUTES = useMemo(() => getFreeMinutes(), []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, checkRes] = await Promise.all([
          fetch("/api/users/me/subscription"),
          fetch("/api/subscription/check"),
        ]);
        if (meRes.ok) setSub(await meRes.json());
        if (checkRes.ok) setSubCheck(await checkRes.json());
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        setSub((prev) => prev ? { ...prev, status: "cancelled" } : prev);
        setShowCancelModal(false);
      } else {
        showToast(data.error || "Failed to cancel subscription", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setCancelling(false);
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const planId = sub?.planId || "free";
  const planName = sub?.planName || "Free";
  const status = sub?.status || "active";
  const minutesUsed = sub?.minutesUsed ?? subCheck?.minutesUsed ?? 0;
  const minutesIncluded = sub?.minutesIncluded ?? subCheck?.minutesIncluded ?? FREE_MINUTES;
  const usagePercent = minutesIncluded > 0 ? Math.min(100, (minutesUsed / minutesIncluded) * 100) : 0;
  const minutesRemaining = Math.max(0, minutesIncluded - minutesUsed);
  const isFree = planId === "free";
  const isCancelled = status === "cancelled";

  const statusColor = isCancelled
    ? "bg-danger/15 text-danger"
    : status === "past_due"
      ? "bg-amber-500/15 text-amber-400"
      : "bg-success/15 text-success";

  const statusLabel = isCancelled
    ? "Cancelled"
    : status === "past_due"
      ? "Past Due"
      : "Active";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted mt-1">Manage your plan and billing</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold">{planName} Plan</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-muted text-sm">
              {isFree
                ? "Free tier with limited features"
                : `${PLANS.find((p) => p.id === planId)?.price || ""}${PLANS.find((p) => p.id === planId)?.period || ""}`}
            </p>
          </div>
          {!isFree && sub?.currentPeriodEnd && (
            <div className="text-right text-sm">
              <div className="text-muted">
                {isCancelled ? "Access until" : "Renews on"}
              </div>
              <div className="font-medium">{formatDate(sub.currentPeriodEnd)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Voice Minutes Usage</h2>
          <div className="text-right">
            <span className="text-2xl font-bold">{minutesUsed.toFixed(1)}</span>
            <span className="text-muted text-sm"> / {minutesIncluded.toFixed(0)} min</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-background rounded-full h-4 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usagePercent > 90 ? "bg-danger" : usagePercent > 70 ? "bg-amber-500" : "bg-accent"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>{usagePercent.toFixed(0)}% used</span>
          <span>{minutesRemaining.toFixed(1)} minutes remaining</span>
        </div>
      </div>

      {/* Plan Comparison */}
      <h2 className="text-xl font-bold mb-4">Compare Plans</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === planId;
          const isUpgrade = PLANS.indexOf(plan) > PLANS.findIndex((p) => p.id === planId);

          return (
            <div
              key={plan.id}
              className={`bg-surface border rounded-2xl p-6 relative transition-all ${
                isCurrent
                  ? "border-accent ring-1 ring-accent/20"
                  : plan.popular
                    ? "border-accent/30"
                    : "border-border"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Current Plan
                </div>
              )}
              {!isCurrent && plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent/20 text-accent-light text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted text-sm">{plan.period}</span>
                </div>
                <div className="text-sm text-muted mt-1">{plan.minutes} voice minutes</div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2 text-sm">
                    <svg
                      className={`w-4 h-4 shrink-0 mt-0.5 ${feature.soon ? "text-muted/50" : "text-success"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className={`flex-1 ${feature.soon ? "text-muted/70" : "text-muted"}`}>
                      {feature.text}
                      {feature.soon && (
                        <span className="ml-1.5 inline-block bg-warning/15 text-warning text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 rounded-lg text-sm font-medium text-center bg-surface-light text-muted">
                  Your Plan
                </div>
              ) : isUpgrade ? (
                <Link
                  href="/pricing"
                  className="block w-full py-2.5 rounded-lg text-sm font-medium text-center bg-accent text-white hover:bg-accent-dark transition-colors"
                >
                  Upgrade
                </Link>
              ) : (
                <div className="w-full py-2.5 rounded-lg text-sm font-medium text-center bg-surface-light text-muted">
                  Downgrade
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Danger Zone - Cancel */}
      {!isFree && !isCancelled && (
        <div className="border border-danger/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-danger mb-2">Danger Zone</h3>
          <p className="text-muted text-sm mb-4">
            Cancelling your subscription will downgrade you to the Free plan at the end of your current billing period.
            You will retain access to all paid features until then.
          </p>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-danger/50 text-danger hover:bg-danger/10 transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Cancel Subscription?</h3>
            <p className="text-muted text-sm text-center mb-6">
              Are you sure you want to cancel your {planName} plan? You will keep access until the end of your current
              billing period{sub?.currentPeriodEnd ? ` (${formatDate(sub.currentPeriodEnd)})` : ""}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-surface-light text-foreground hover:bg-border transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-danger text-white hover:bg-danger/80 transition-colors disabled:opacity-50"
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 z-50 ${
          toast.type === "success" ? "bg-surface border-success/30" : "bg-surface border-danger/30"
        }`}>
          <svg
            className={`w-5 h-5 shrink-0 ${toast.type === "success" ? "text-success" : "text-danger"}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            {toast.type === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            )}
          </svg>
          <span className="text-base">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
