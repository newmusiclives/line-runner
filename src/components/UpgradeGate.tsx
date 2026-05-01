"use client";

import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import Link from "next/link";

interface UpgradeGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function UpgradeGate({ feature, children, fallback }: UpgradeGateProps) {
  const { allowed, requiredTier, userTier, loading, reason } = useFeatureAccess(feature);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <svg className="w-6 h-6 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
  // The API returns this exact string when a flag is disabled regardless of tier
  const isDisabled = reason === "Feature is currently disabled";

  if (isDisabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6 text-center max-w-2xl mx-auto py-16">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-warning bg-warning/10 px-3 py-1 rounded-full mb-3">
          Coming Soon
        </span>
        <h3 className="text-2xl font-bold mb-2">This feature isn&apos;t live yet</h3>
        <p className="text-muted mb-6">
          We&apos;re shipping features in batches. Your{" "}
          <span className="text-foreground font-medium">{userTier === "free" ? "Free" : userTier.charAt(0).toUpperCase() + userTier.slice(1)}</span>{" "}
          plan will get this automatically when it launches — no need to do anything.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Back to dashboard
          </Link>
          <Link
            href="/upload"
            className="bg-surface border border-border hover:bg-surface-light text-foreground font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Rehearse a script
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 text-center max-w-2xl mx-auto py-16">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-accent-light bg-accent/10 px-3 py-1 rounded-full mb-3">
        {tierName} feature
      </span>
      <h3 className="text-2xl font-bold mb-2">Upgrade to unlock</h3>
      <p className="text-muted mb-6">
        {reason || `This feature is included with the ${tierName} plan.`}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/pricing"
          className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          See {tierName} plan
        </Link>
        <Link
          href="/dashboard"
          className="bg-surface border border-border hover:bg-surface-light text-foreground font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
