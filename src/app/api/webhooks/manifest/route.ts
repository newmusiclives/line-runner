import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { ensureTable, getSetting } from "@/lib/db/integrations";

// Constant-time compare of two hex signatures, tolerant of differing lengths.
function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  await ensureTable();
  const secretKey = await getSetting("manifest_secret_key");

  // Read the raw body once so the HMAC is computed over the exact bytes sent.
  const rawBody = await request.text();
  const webhookSignature = request.headers.get("x-manifest-signature");

  // Verify the HMAC-SHA256 signature. When a secret is configured we require a
  // valid signature — reject anything unsigned or mismatched so a leaked
  // endpoint URL can't be used to forge payment events.
  if (secretKey) {
    const expected = createHmac("sha256", secretKey).update(rawBody).digest("hex");
    // Accept an optional "sha256=" prefix, which some providers prepend.
    const provided = (webhookSignature || "").replace(/^sha256=/, "").trim();
    if (!provided || !signaturesMatch(provided, expected)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  interface ManifestData {
    transaction_id?: string;
    customer_email?: string;
    amount?: number;
    metadata?: unknown;
    subscription_id?: string;
  }
  let body: { event?: string; data?: ManifestData };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
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
