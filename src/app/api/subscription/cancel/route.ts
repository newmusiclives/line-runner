import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getActiveSubscription, updateSubscriptionStatus } from "@/lib/db/subscriptions";
import { ensureTable, getSetting } from "@/lib/db/integrations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getActiveSubscription(session.user.id);
  if (!sub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  if (sub.plan_id === "free") {
    return NextResponse.json({ error: "Cannot cancel free plan" }, { status: 400 });
  }

  // Try to cancel via Manifest Financial if configured
  await ensureTable();
  const manifestUrl = await getSetting("manifest_api_url");
  const manifestKey = await getSetting("manifest_secret_key");

  if (manifestUrl && manifestKey && sub.manifest_sub_id) {
    try {
      await fetch(`${manifestUrl}/subscriptions/${sub.manifest_sub_id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${manifestKey}`,
        },
      });
    } catch {
      // Continue with local cancellation even if Manifest fails
    }
  }

  await updateSubscriptionStatus(sub.id, "cancelled");
  return NextResponse.json({ success: true, message: "Subscription cancelled. You'll retain access until the end of your current period." });
}
