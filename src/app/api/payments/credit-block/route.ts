import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { CREDIT_BLOCKS } from "@/lib/manifest-financial";
import { getActiveSubscription } from "@/lib/db/subscriptions";
import { ensureTable, getSetting } from "@/lib/db/integrations";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blockId } = await request.json();
  const block = CREDIT_BLOCKS.find((b) => b.id === blockId);
  if (!block) {
    return NextResponse.json({ error: "Invalid block" }, { status: 400 });
  }

  // Must have Pro or Studio subscription to buy blocks
  const sub = await getActiveSubscription(session.user.id);
  if (!sub || sub.plan_id === "free") {
    return NextResponse.json({ error: "Credit blocks require a Pro or Studio subscription" }, { status: 403 });
  }

  const amountCents = Math.round(block.price * 100);

  // Try Manifest Financial
  await ensureTable();
  const manifestUrl = await getSetting("manifest_api_url");
  const manifestKey = await getSetting("manifest_secret_key");

  let transactionId: string;
  let mode: "live" | "simulated";

  if (manifestUrl && manifestKey) {
    try {
      const payRes = await fetch(`${manifestUrl}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${manifestKey}`,
        },
        body: JSON.stringify({
          amount: amountCents,
          currency: "usd",
          description: `Line Runner - ${block.minutes} minute credit block`,
          customer_email: session.user.email,
          metadata: { block_id: block.id, user_id: session.user.id },
        }),
      });

      if (!payRes.ok) {
        return NextResponse.json({ error: "Payment failed" }, { status: 402 });
      }

      const payData = await payRes.json();
      transactionId = payData.id || payData.transaction_id || payData.payment_id;
      mode = "live";
    } catch (err: any) {
      return NextResponse.json({ error: "Payment error", details: err.message }, { status: 502 });
    }
  } else {
    transactionId = `sim_block_${Date.now()}`;
    mode = "simulated";
  }

  // Add minutes to subscription
  const sql = getDb();
  await sql`UPDATE subscriptions SET minutes_included = minutes_included + ${block.minutes} WHERE id = ${sub.id}`;

  // Record purchase
  await sql`CREATE TABLE IF NOT EXISTS credit_purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    block_id TEXT NOT NULL,
    minutes_added INT NOT NULL,
    amount_cents INT NOT NULL,
    transaction_id TEXT,
    mode TEXT DEFAULT 'simulated',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`INSERT INTO credit_purchases (id, user_id, subscription_id, block_id, minutes_added, amount_cents, transaction_id, mode)
    VALUES (${nanoid()}, ${session.user.id}, ${sub.id}, ${block.id}, ${block.minutes}, ${amountCents}, ${transactionId}, ${mode})`;

  return NextResponse.json({
    success: true,
    mode,
    minutesAdded: block.minutes,
    newTotal: sub.minutes_included + block.minutes,
  });
}
