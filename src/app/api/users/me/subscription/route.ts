import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getActiveSubscription } from "@/lib/db/subscriptions";

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  monthly: "Pro",
  studio: "Studio",
};

// Free-tier quota. Older DB rows may have stale values (2.5 or 3 from
// previous defaults) — override at read time so the dashboard reflects the
// current policy without a DB migration. Keep in sync with FREE_MINUTES_INCLUDED
// in subscription-guard.ts and PRICING_PLANS[free].maxMinutes.
const FREE_MINUTES_INCLUDED = 5;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getActiveSubscription(session.user.id);
  if (!subscription) {
    return NextResponse.json({
      planId: "free",
      planName: "Free",
      status: "active",
      minutesUsed: 0,
      minutesIncluded: FREE_MINUTES_INCLUDED,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }

  const minutesIncluded = subscription.plan_id === "free"
    ? FREE_MINUTES_INCLUDED
    : subscription.minutes_included;

  return NextResponse.json({
    planId: subscription.plan_id,
    planName: PLAN_NAMES[subscription.plan_id] || subscription.plan_id,
    status: subscription.status,
    minutesUsed: subscription.minutes_used,
    minutesIncluded,
    currentPeriodEnd: subscription.current_period_end,
  });
}
