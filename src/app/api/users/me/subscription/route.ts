import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getActiveSubscription } from "@/lib/db/subscriptions";

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  monthly: "Pro",
  studio: "Studio",
};

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
      minutesIncluded: 2.5,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }

  return NextResponse.json({
    planId: subscription.plan_id,
    planName: PLAN_NAMES[subscription.plan_id] || subscription.plan_id,
    status: subscription.status,
    minutesUsed: subscription.minutes_used,
    minutesIncluded: subscription.minutes_included,
    currentPeriodEnd: subscription.current_period_end,
  });
}
