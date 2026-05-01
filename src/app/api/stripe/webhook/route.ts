import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret, planIdFromStripePriceId } from "@/lib/stripe";
import { PRICING_PLANS } from "@/lib/manifest-financial";
import { syncContactToGhl, addTagToContact } from "@/lib/gohighlevel";
import { getUserById } from "@/lib/db/users";
import {
  upsertStripeSubscription,
  updateSubscriptionStatusByStripeId,
  type DbSubscription,
} from "@/lib/db/subscriptions";

export const runtime = "nodejs";

function mapStripeStatus(status: Stripe.Subscription.Status): DbSubscription["status"] {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "expired";
    default:
      return "expired";
  }
}

async function persistSubscription(stripeSub: Stripe.Subscription, fallbackUserId?: string) {
  const item = stripeSub.items.data[0];
  const priceId = item?.price?.id;
  const planId =
    (await planIdFromStripePriceId(priceId)) ??
    stripeSub.metadata?.planId ??
    null;
  if (!planId) {
    return { skipped: true, reason: "Could not resolve planId from priceId or metadata" };
  }

  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return { skipped: true, reason: `Unknown plan ${planId}` };
  }

  const userId = stripeSub.metadata?.userId || fallbackUserId;
  if (!userId) {
    return { skipped: true, reason: "No userId on subscription metadata" };
  }

  const customerId =
    typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id;

  await upsertStripeSubscription({
    userId,
    planId,
    amountCents: Math.round(plan.price * 100),
    period: plan.period,
    minutesIncluded: plan.costBreakdown.includedMinutes,
    voicesIncluded: plan.costBreakdown.includedVoices,
    stripeCustomerId: customerId,
    stripeSubscriptionId: stripeSub.id,
    status: mapStripeStatus(stripeSub.status),
    currentPeriodStart: item?.current_period_start
      ? new Date(item.current_period_start * 1000)
      : null,
    currentPeriodEnd: item?.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null,
  });

  return { skipped: false };
}

export async function POST(request: Request) {
  const webhookSecret = await getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = await getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Invalid signature: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (
          checkoutSession.mode === "subscription" &&
          typeof checkoutSession.subscription === "string"
        ) {
          const stripeSub = await stripe.subscriptions.retrieve(checkoutSession.subscription);
          await persistSubscription(stripeSub, checkoutSession.client_reference_id ?? undefined);

          // Best-effort CRM sync — never blocks the webhook ack
          const userId = stripeSub.metadata?.userId || checkoutSession.client_reference_id;
          const planId =
            (await planIdFromStripePriceId(stripeSub.items.data[0]?.price?.id)) ??
            stripeSub.metadata?.planId ??
            null;
          if (userId && planId) {
            const user = await getUserById(userId).catch(() => null);
            const email = user?.email || checkoutSession.customer_email || checkoutSession.customer_details?.email;
            const name = user?.name || checkoutSession.customer_details?.name || "";
            if (email) {
              const planName = PRICING_PLANS.find((p) => p.id === planId)?.name?.toLowerCase() ?? planId;
              await syncContactToGhl({
                email,
                name,
                tags: [`plan:${planName}`, "subscriber", "stripe-checkout"],
                source: "Line Runner — Stripe",
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const stripeSub = event.data.object as Stripe.Subscription;
        await persistSubscription(stripeSub);
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        await updateSubscriptionStatusByStripeId(stripeSub.id, "cancelled");

        // Tag in CRM as churned, best-effort
        const userId = stripeSub.metadata?.userId;
        if (userId) {
          const user = await getUserById(userId).catch(() => null);
          if (user?.email) {
            await addTagToContact(user.email, ["churned", "subscription-cancelled"]);
          }
        }
        break;
      }

      default:
        // Ignore other event types — Stripe will retry on non-2xx so always 200 here.
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Handler failed: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
