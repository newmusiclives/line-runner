"use client";

import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import Link from "next/link";

interface UpgradeGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function UpgradeGate({ feature, children, fallback }: UpgradeGateProps) {
  const { allowed, requiredTier, loading, reason } = useFeatureAccess(feature);

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

  if (!allowed) {
    if (fallback) return <>{fallback}</>;

    const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">{tierName} Feature</h3>
        <p className="text-muted mb-6 max-w-md">
          {reason || `This feature requires a ${tierName} plan or higher.`}
        </p>
        <Link
          href="/pricing"
          className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          View Plans
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
