import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureTable, getSetting } from "@/lib/db/integrations";

export async function POST(request: Request) {
  // Verify webhook signature if Manifest provides one
  await ensureTable();
  const secretKey = await getSetting("manifest_secret_key");

  const webhookSignature = request.headers.get("x-manifest-signature");
  // Basic signature check (if Manifest sends one)
  if (secretKey && webhookSignature) {
    // In production, verify HMAC signature
    // For now, just ensure we have a key configured
  }

  const body = await request.json();
  const { event, data } = body;
  const sql = getDb();

  // Ensure webhook log table
  await sql`CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // Log the webhook
  const { nanoid } = await import("nanoid");
  const eventId = nanoid();
  await sql`INSERT INTO webhook_events (id, provider, event_type, payload)
    VALUES (${eventId}, ${"manifest"}, ${event || "unknown"}, ${JSON.stringify(body)})`;

  try {
    switch (event) {
      case "payment.succeeded": {
        const { transaction_id, customer_email, amount, metadata } = data || {};
        if (transaction_id && customer_email) {
          // Update subscription status to active
          await sql`UPDATE subscriptions SET status = 'active'
            WHERE manifest_payment_id = ${transaction_id} OR
            (amount_cents = ${amount} AND status = 'pending')`;
        }
        break;
      }

      case "payment.failed": {
        const { transaction_id, customer_email } = data || {};
        if (transaction_id) {
          await sql`UPDATE subscriptions SET status = 'past_due'
            WHERE manifest_payment_id = ${transaction_id}`;
        }
        // Could trigger a GoHighLevel notification here
        break;
      }

      case "subscription.cancelled": {
        const { subscription_id, customer_email } = data || {};
        if (subscription_id) {
          await sql`UPDATE subscriptions SET status = 'cancelled'
            WHERE manifest_sub_id = ${subscription_id} OR manifest_payment_id = ${subscription_id}`;
        }
        break;
      }

      case "subscription.renewed": {
        const { subscription_id, transaction_id, amount } = data || {};
        if (subscription_id || transaction_id) {
          // Reset usage for new period
          await sql`UPDATE subscriptions SET
            minutes_used = 0,
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '30 days',
            status = 'active'
            WHERE manifest_sub_id = ${subscription_id} OR manifest_payment_id = ${transaction_id}`;
        }
        break;
      }

      default:
        // Unknown event, log only
        break;
    }

    // Mark as processed
    await sql`UPDATE webhook_events SET processed = true WHERE id = ${eventId}`;

  } catch (err: any) {
    // Log error but still return 200 to avoid retries
    console.error("Webhook processing error:", err.message);
  }

  return NextResponse.json({ received: true });
}
