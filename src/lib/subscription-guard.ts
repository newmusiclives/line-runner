import { getDb } from "@/lib/db";
import { getActiveSubscription } from "@/lib/db/subscriptions";

export type PlanTier = "free" | "pro" | "studio";

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, studio: 2 };

// Map plan_id from subscriptions table to tier
function planToTier(planId: string | null): PlanTier {
  if (!planId) return "free";
  if (planId === "studio") return "studio";
  if (planId === "monthly" || planId === "pro") return "pro";
  return "free";
}

export interface SubscriptionCheck {
  allowed: boolean;
  tier: PlanTier;
  minutesRemaining: number;
  minutesUsed: number;
  minutesIncluded: number;
  reason?: string;
}

export async function checkSubscription(userId: string): Promise<SubscriptionCheck> {
  const sub = await getActiveSubscription(userId);

  if (!sub) {
    return {
      allowed: true,
      tier: "free",
      minutesRemaining: 2.5,
      minutesUsed: 0,
      minutesIncluded: 2.5,
    };
  }

  const tier = planToTier(sub.plan_id);
  const remaining = Math.max(0, sub.minutes_included - sub.minutes_used);

  return {
    allowed: true,
    tier,
    minutesRemaining: remaining,
    minutesUsed: sub.minutes_used,
    minutesIncluded: sub.minutes_included,
  };
}

export async function checkFeatureAccess(
  userId: string,
  featureKey: string
): Promise<{ allowed: boolean; requiredTier: PlanTier; userTier: PlanTier; reason?: string }> {
  const sql = getDb();

  // Get feature flag
  const flags = await sql`SELECT enabled, min_tier FROM feature_flags WHERE key = ${featureKey} LIMIT 1`;

  if (flags.length === 0) {
    // Feature not in flags table — allow by default
    return { allowed: true, requiredTier: "free", userTier: "free" };
  }

  const flag = flags[0] as { enabled: boolean; min_tier: string };

  if (!flag.enabled) {
    return { allowed: false, requiredTier: flag.min_tier as PlanTier, userTier: "free", reason: "Feature is currently disabled" };
  }

  const requiredTier = (flag.min_tier || "free") as PlanTier;
  const sub = await getActiveSubscription(userId);
  const userTier = planToTier(sub?.plan_id || null);

  if (TIER_RANK[userTier] < TIER_RANK[requiredTier]) {
    return {
      allowed: false,
      requiredTier,
      userTier,
      reason: `This feature requires a ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan or higher`,
    };
  }

  return { allowed: true, requiredTier, userTier };
}

export async function checkVoiceCredits(
  userId: string,
  estimatedMinutes: number
): Promise<{ allowed: boolean; minutesRemaining: number; reason?: string }> {
  const sub = await getActiveSubscription(userId);

  if (!sub) {
    // Free tier: 2.5 minutes total (check from DB how much used)
    const sql = getDb();
    const usage = await sql`SELECT COALESCE(SUM(minutes_used), 0) as total FROM subscriptions WHERE user_id = ${userId}`;
    const used = Number((usage[0] as any)?.total || 0);
    const remaining = Math.max(0, 2.5 - used);

    if (estimatedMinutes > remaining) {
      return { allowed: false, minutesRemaining: remaining, reason: `Free plan has ${remaining.toFixed(1)} minutes remaining. Upgrade to Pro for 40 minutes/month.` };
    }
    return { allowed: true, minutesRemaining: remaining };
  }

  const remaining = Math.max(0, sub.minutes_included - sub.minutes_used);

  if (estimatedMinutes > remaining) {
    const tier = planToTier(sub.plan_id);
    return {
      allowed: false,
      minutesRemaining: remaining,
      reason: `You have ${remaining.toFixed(1)} minutes remaining this period. ${tier === "pro" ? "Purchase a credit block or upgrade to Studio." : "Purchase a credit block for more minutes."}`
    };
  }

  return { allowed: true, minutesRemaining: remaining };
}
