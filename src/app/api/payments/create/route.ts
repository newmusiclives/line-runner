import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { paymentSchema } from "@/lib/validators";
import { PRICING_PLANS } from "@/lib/manifest-financial";
import { createSubscription } from "@/lib/db/subscriptions";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { planId, email, name } = parsed.data;
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Simulate payment success for now
  const amountCents = Math.round(plan.price * 100);
  const subscription = createSubscription(
    session.user.id,
    plan.id,
    amountCents,
    plan.period,
    plan.costBreakdown.includedMinutes,
    plan.costBreakdown.includedVoices,
    `sim_${Date.now()}` // simulated payment ID
  );

  return NextResponse.json({ success: true, subscription }, { status: 201 });
}
