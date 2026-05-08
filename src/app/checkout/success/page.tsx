"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface SubInfo {
  planId: string;
  planName: string;
  status: string;
  minutesIncluded: number;
  currentPeriodEnd: string;
}

const PLAN_DETAILS: Record<string, { name: string; price: number; minutes: number; perks: string[] }> = {
  monthly: {
    name: "Pro",
    price: 20,
    minutes: 40,
    perks: [
      "Unlimited scene runs (was 1/month on Free)",
      "40 voice minutes per month (~10× more than Free)",
      "10 AI voices per script",
      "Everything in Free — script analysis, line memory, bookmarks, teleprompter",
    ],
  },
  studio: {
    name: "Studio",
    price: 70,
    minutes: 75,
    perks: [
      "Unlimited scene runs",
      "75 voice minutes per month",
      "25 AI voices per script",
      "Everything in Pro included",
    ],
  },
};

const CREDIT_BLOCK_MINUTES: Record<string, number> = {
  block_10: 10,
  block_40: 40,
  block_100: 100,
};

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { status: authStatus } = useSession();
  const purchaseType = params.get("type"); // "credit" for one-time blocks; null/undefined for subscription
  const blockId = params.get("block");
  const planId = params.get("plan") || "monthly";
  const sessionId = params.get("session_id");
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);

  const planDetails = PLAN_DETAILS[planId] || PLAN_DETAILS.monthly;
  const isCreditPurchase = purchaseType === "credit" && blockId;
  const creditMinutes = blockId ? CREDIT_BLOCK_MINUTES[blockId] ?? 0 : 0;

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [authStatus, router]);

  // Poll subscription status until the webhook has flipped us to active.
  // After ~12s of polling we stop and show the optimistic state.
  useEffect(() => {
    if (isCreditPurchase) return; // credit-block flow doesn't change subscription state
    if (authStatus !== "authenticated") return;
    if (sub?.planId === planId && sub.status === "active") return;
    if (pollAttempts > 6) return;

    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/users/me/subscription");
        if (res.ok) {
          const data = await res.json();
          setSub(data);
        }
      } catch {
        // ignore — we still show the optimistic page
      }
      setPollAttempts((n) => n + 1);
    }, pollAttempts === 0 ? 0 : 2000);

    return () => clearTimeout(t);
  }, [authStatus, sub, planId, pollAttempts, isCreditPurchase]);

  const subActive = sub?.planId === planId && sub.status === "active";
  const stillProcessing = !subActive && pollAttempts <= 6;

  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (isCreditPurchase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-success"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            +{creditMinutes} minutes added.
          </h1>
          <p className="text-muted text-base sm:text-lg">
            Your credit block is being applied to your subscription. Stripe usually confirms within
            a few seconds.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-6 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-muted shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25"
            />
          </svg>
          <div className="text-sm text-muted">
            A receipt has been emailed to you. Credit blocks never expire during your billing period
            and are added on top of your monthly allowance.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          <Link
            href="/dashboard/credits"
            className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 sm:px-8 py-3.5 rounded-xl transition-colors text-center"
          >
            Back to credits
          </Link>
          <Link
            href="/upload"
            className="bg-surface border border-border hover:bg-surface-light text-foreground font-semibold px-6 sm:px-8 py-3.5 rounded-xl transition-colors text-center"
          >
            Start a rehearsal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-success"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          You&apos;re in.
        </h1>
        <p className="text-muted text-lg">
          Welcome to <span className="text-foreground font-semibold">Line Runner {planDetails.name}</span>.
          Payment confirmed.
        </p>
      </div>

      {/* Plan summary */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              Subscription
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{planDetails.name}</span>
              <span className="text-muted">·</span>
              <span className="text-muted">${planDetails.price}/month</span>
            </div>
          </div>
          {stillProcessing ? (
            <span className="inline-flex items-center gap-2 text-xs bg-warning/15 text-warning px-3 py-1.5 rounded-full font-medium">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Activating
            </span>
          ) : (
            <span className="text-xs bg-success/15 text-success px-3 py-1.5 rounded-full font-medium">
              Active
            </span>
          )}
        </div>
        <p className="text-sm text-muted">
          {stillProcessing
            ? "Stripe is still confirming the payment with our server. Activation usually takes a few seconds — feel free to start using the app, your plan will be live by the time you finish reading this."
            : `Your subscription is active. Renews monthly. Cancel anytime in Account → Subscription.`}
        </p>
      </div>

      {/* What's unlocked */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">What&apos;s unlocked</h2>
        <ul className="space-y-3">
          {planDetails.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-sm">{perk}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted mt-4">
          Some advanced {planDetails.name} features (AI Performance Coach, additional rehearsal modes,
          Self-Tape Studio, Audition Vault, Scene Exchange) are marked
          <span className="mx-1 inline-block bg-warning/15 text-warning text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded">Soon</span>
          and will roll out as they ship — your subscription locks them in at this price when they do.
        </p>
      </div>

      {/* Receipt */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-8 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-muted shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
        <div className="text-sm text-muted">
          A receipt has been emailed to you by Stripe. You can manage your subscription, update your
          card, or cancel anytime from{" "}
          <Link href="/dashboard/subscription" className="text-accent-light hover:text-accent underline underline-offset-2">
            Account → Subscription
          </Link>
          .
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
        <Link
          href="/upload"
          className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-center"
        >
          Upload your first script
        </Link>
        <Link
          href="/dashboard"
          className="bg-surface border border-border hover:bg-surface-light text-foreground font-semibold px-8 py-3.5 rounded-xl transition-colors text-center"
        >
          Go to dashboard
        </Link>
      </div>

      {sessionId && (
        <p className="text-center text-xs text-muted/60 mt-8 font-mono">
          Reference: {sessionId.slice(0, 24)}…
        </p>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
