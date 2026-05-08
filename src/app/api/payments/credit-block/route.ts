import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { CREDIT_BLOCKS } from "@/lib/manifest-financial";
import { ensureActiveSubscription } from "@/lib/db/subscriptions";
import { getStripe, getAppUrl, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({
  blockId: z.string().min(1),
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

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const block = CREDIT_BLOCKS.find((b) => b.id === parsed.data.blockId);
  if (!block) {
    return NextResponse.json({ error: "Invalid block" }, { status: 400 });
  }

  // Credit blocks are pay-as-you-go — available to free users too. The block
  // minutes are added to whatever subscription row the user has; create a
  // free-tier row if they're brand new so the webhook has somewhere to credit.
  const sub = await ensureActiveSubscription(session.user.id);

  const stripe = await getStripe();
  const appUrl = getAppUrl();

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(block.price * 100),
            product_data: {
              name: `Line Runner — ${block.minutes} minute credit block`,
              description: `${block.credits.toLocaleString()} credits ($${block.perMinute.toFixed(2)}/min)`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      success_url: `${appUrl}/checkout/success?type=credit&block=${block.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/credits?checkout=cancelled`,
      metadata: {
        userId: session.user.id,
        subscriptionId: sub.id,
        blockId: block.id,
        minutes: String(block.minutes),
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating checkout session";
    const code = (err as { code?: string })?.code;
    return NextResponse.json(
      { error: `Stripe rejected the credit block checkout: ${message}`, code },
      { status: 502 }
    );
  }
}
