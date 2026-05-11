import { getDb } from "@/lib/db";
import { getActiveSubscription } from "@/lib/db/subscriptions";

export type PlanTier = "free" | "pro" | "studio";

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, studio: 2 };

// Free-tier voice quota. Kept here so existing DB rows from before the bump
// (which stored minutes_included = 2.5) automatically get corrected at read
// time without needing a DB migration. Source-of-truth alignment with
// PRICING_PLANS[free].maxMinutes in manifest-financial.ts.
const FREE_MINUTES_INCLUDED = 5;

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
      minutesRemaining: FREE_MINUTES_INCLUDED,
      minutesUsed: 0,
      minutesIncluded: FREE_MINUTES_INCLUDED,
    };
  }

  const tier = planToTier(sub.plan_id);
  const included = tier === "free" ? FREE_MINUTES_INCLUDED : sub.minutes_included;
  const remaining = Math.max(0, included - sub.minutes_used);

  return {
    allowed: true,
    tier,
    minutesRemaining: remaining,
    minutesUsed: sub.minutes_used,
    minutesIncluded: included,
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
    // Free tier (no subscription row): use FREE_MINUTES_INCLUDED quota.
    const sql = getDb();
    const usage = await sql`SELECT COALESCE(SUM(minutes_used), 0) as total FROM subscriptions WHERE user_id = ${userId}`;
    const used = Number((usage[0] as any)?.total || 0);
    const remaining = Math.max(0, FREE_MINUTES_INCLUDED - used);

    if (estimatedMinutes > remaining) {
      return { allowed: false, minutesRemaining: remaining, reason: `Free plan has ${remaining.toFixed(1)} minutes remaining. Upgrade to Pro for 110 minutes/month or buy a credit block.` };
    }
    return { allowed: true, minutesRemaining: remaining };
  }

  const tier = planToTier(sub.plan_id);
  // Free-tier rows may have a stale minutes_included from before the 5-min bump
  // (DB used to store 2.5). Override at read time so existing free users get
  // the current quota without a DB migration.
  const included = tier === "free" ? FREE_MINUTES_INCLUDED : sub.minutes_included;
  const remaining = Math.max(0, included - sub.minutes_used);

  if (estimatedMinutes > remaining) {
    return {
      allowed: false,
      minutesRemaining: remaining,
      reason: `You have ${remaining.toFixed(1)} minutes remaining this period. ${tier === "pro" ? "Purchase a credit block or upgrade to Studio." : tier === "studio" ? "Purchase a credit block for more minutes." : "Upgrade to Pro for 110 minutes/month or buy a credit block."}`
    };
  }

  return { allowed: true, minutesRemaining: remaining };
}
