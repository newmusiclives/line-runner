"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CREDIT_BLOCKS } from "@/lib/manifest-financial";

interface SubscriptionInfo {
  tier: string;
  planName: string;
  minutesUsed: number;
  minutesIncluded: number;
  active: boolean;
}

function CreditsInner() {
  const params = useSearchParams();
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  // Surface checkout cancellation when Stripe redirects back to /dashboard/credits?checkout=cancelled
  useEffect(() => {
    if (params.get("checkout") === "cancelled") {
      showToast("Checkout cancelled. No charge was made.", "error");
    }
  }, [params]);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/subscription/check");
      if (res.ok) {
        const data = await res.json();
        setSub({
          tier: data.tier || data.plan_id || "free",
          planName: data.planName || data.tier || "Free",
          minutesUsed: data.minutesUsed ?? data.minutes_used ?? 0,
          minutesIncluded: data.minutesIncluded ?? data.minutes_included ?? 5,
          active: data.active !== false,
        });
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }

  async function buyBlock(blockId: string) {
    setBuying(blockId);
    try {
      const res = await fetch("/api/payments/credit-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      showToast(data.error || "Could not start checkout", "error");
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setBuying(null);
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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

  const minutesRemaining = Math.max(0, (sub?.minutesIncluded ?? 0) - (sub?.minutesUsed ?? 0));
  const usagePercent = sub?.minutesIncluded
    ? Math.min(100, ((sub.minutesUsed ?? 0) / sub.minutesIncluded) * 100)
    : 0;
  const isFree = !sub || sub.tier === "free";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Credit Blocks</h1>
        <p className="text-muted mt-1">
          Buy additional voice minutes when you need them.
        </p>
      </div>

      {/* Current Plan Info */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {sub?.planName === "monthly" ? "Pro" : sub?.planName === "studio" ? "Studio" : sub?.tier === "monthly" ? "Pro" : sub?.tier === "studio" ? "Studio" : "Free"} Plan
              </h2>
              {sub?.active && (
                <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-muted mt-0.5">
              {minutesRemaining.toFixed(1)} minutes remaining of {sub?.minutesIncluded ?? 0} total
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{(sub?.minutesUsed ?? 0).toFixed(1)}</div>
            <div className="text-xs text-muted">minutes used</div>
          </div>
        </div>

        {/* Usage bar */}
        <div className="w-full bg-background rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usagePercent > 90 ? "bg-danger" : usagePercent > 70 ? "bg-amber-500" : "bg-accent"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted">
          <span>{usagePercent.toFixed(0)}% used</span>
          <span>{(sub?.minutesIncluded ?? 0).toFixed(0)} min included</span>
        </div>
      </div>

      {/* Subscription upsell — shown to free-tier users above the credit blocks */}
      {isFree && (
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <svg className="w-10 h-10 text-accent shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Subscribers save up to 64% per minute</h3>
              <p className="text-sm text-muted mb-3">
                Pro is <strong>$20/month for 110 minutes</strong> ($0.18/min) — 64% cheaper than the $0.50 block and 39% cheaper than the $0.30 block. You can still buy blocks below if you prefer pay-as-you-go.
              </p>
              <a
                href="/pricing"
                className="inline-block px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
              >
                Compare plans
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Credit Block Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {CREDIT_BLOCKS.map((block) => (
          <div
            key={block.id}
            className={`bg-surface border rounded-2xl p-6 relative overflow-hidden transition-all hover:border-accent/40 ${
              block.savings === "Best value" ? "border-accent/50 ring-1 ring-accent/20" : "border-border"
            }`}
          >
            {/* Savings badge */}
            {block.savings && (
              <div className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${
                block.savings === "Best value"
                  ? "bg-accent/20 text-accent-light"
                  : "bg-success/15 text-success"
              }`}>
                {block.savings}
              </div>
            )}

            {/* Minutes */}
            <div className="text-3xl font-bold mb-1">{block.minutes}</div>
            <div className="text-sm text-muted mb-4">minutes</div>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold">${block.price}</span>
            </div>
            <div className="text-xs text-muted mb-6">
              ${block.perMinute.toFixed(2)}/minute
            </div>

            {/* Buy button */}
            <button
              onClick={() => buyBlock(block.id)}
              disabled={buying !== null}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                buying === block.id
                  ? "bg-accent/60 text-white cursor-wait"
                  : "bg-accent text-white hover:bg-accent-dark"
              }`}
            >
              {buying === block.id ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Buy ${block.minutes} minutes`
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="mt-8 text-center text-sm text-muted">
        <p>Credit blocks are added to your current subscription and never expire during your billing period.</p>
        <p className="mt-1">Payments are processed securely.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 ${
          toast.type === "success"
            ? "bg-surface border-success/30"
            : "bg-surface border-danger/30"
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

export default function CreditsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      }
    >
      <CreditsInner />
    </Suspense>
  );
}
