import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getStripe, getStripePriceId, getAppUrl, isStripeConfigured } from "@/lib/stripe";
import { PRICING_PLANS } from "@/lib/manifest-financial";

export const runtime = "nodejs";

const bodySchema = z.object({
  planId: z.string().min(1),
});

export async function POST(request: Request) {
  if (!(await isStripeConfigured())) {
    return NextResponse.json(
      { error: "Stripe is not configured on the server" },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = PRICING_PLANS.find((p) => p.id === parsed.data.planId);
  if (!plan || plan.price === 0) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = await getStripePriceId(plan.id);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for plan "${plan.id}"` },
      { status: 500 }
    );
  }

  const stripe = await getStripe();
  const appUrl = getAppUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: session.user.email,
    client_reference_id: session.user.id,
    success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        userId: session.user.id,
        planId: plan.id,
      },
    },
    metadata: {
      userId: session.user.id,
      planId: plan.id,
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL" },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
