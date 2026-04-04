"use client";

import { useState, useEffect, useCallback } from "react";

interface FeatureAccess {
  allowed: boolean;
  requiredTier: string;
  userTier: string;
  reason?: string;
  loading: boolean;
}

export function useFeatureAccess(featureKey: string): FeatureAccess {
  const [state, setState] = useState<FeatureAccess>({
    allowed: true,
    requiredTier: "free",
    userTier: "free",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`/api/subscription/check?feature=${featureKey}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setState({ ...data, loading: false });
        }
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false }));
      }
    }

    check();
    return () => { cancelled = true; };
  }, [featureKey]);

  return state;
}

interface SubscriptionStatus {
  tier: string;
  minutesRemaining: number;
  minutesUsed: number;
  minutesIncluded: number;
  loading: boolean;
}

export function useSubscription(): SubscriptionStatus {
  const [state, setState] = useState<SubscriptionStatus>({
    tier: "free",
    minutesRemaining: 0,
    minutesUsed: 0,
    minutesIncluded: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/subscription/check");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setState({ ...data, loading: false });
        }
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false }));
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return state;
}
