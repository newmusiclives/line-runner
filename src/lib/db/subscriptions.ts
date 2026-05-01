import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DbSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "past_due" | "expired";
  manifest_payment_id: string | null;
  manifest_sub_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  amount_cents: number;
  period: string;
  minutes_included: number;
  minutes_used: number;
  voices_included: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

let _stripeColumnsEnsured = false;
async function ensureStripeColumns() {
  if (_stripeColumnsEnsured) return;
  const sql = getDb();
  await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
  await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subs_stripe_sub_id ON subscriptions(stripe_subscription_id)`;
  _stripeColumnsEnsured = true;
}

export async function createSubscription(
  userId: string,
  planId: string,
  amountCents: number,
  period: string,
  minutesIncluded: number,
  voicesIncluded: number,
  manifestPaymentId?: string
): Promise<DbSubscription> {
  const sql = getDb();
  const id = nanoid();
  const now = new Date().toISOString();
  const periodEnd = new Date();
  if (period === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
  else if (period === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setDate(periodEnd.getDate() + 60);

  await sql`INSERT INTO subscriptions (id, user_id, plan_id, amount_cents, period, minutes_included, voices_included, manifest_payment_id, current_period_start, current_period_end)
     VALUES (${id}, ${userId}, ${planId}, ${amountCents}, ${period}, ${minutesIncluded}, ${voicesIncluded}, ${manifestPaymentId || null}, ${now}, ${periodEnd.toISOString()})`;

  const rows = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;
  return rows[0] as DbSubscription;
}

export async function getActiveSubscription(userId: string): Promise<DbSubscription | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM subscriptions WHERE user_id = ${userId} AND status = 'active' ORDER BY created_at DESC LIMIT 1`;
  return (rows[0] as DbSubscription) ?? null;
}

export async function updateSubscriptionStatus(id: string, status: DbSubscription["status"]) {
  const sql = getDb();
  await sql`UPDATE subscriptions SET status = ${status} WHERE id = ${id}`;
}

export async function incrementMinutesUsed(id: string, minutes: number) {
  const sql = getDb();
  await sql`UPDATE subscriptions SET minutes_used = minutes_used + ${minutes} WHERE id = ${id}`;
}

export async function listAllSubscriptions(): Promise<DbSubscription[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM subscriptions ORDER BY created_at DESC`;
  return rows as DbSubscription[];
}

// Stripe-backed subscription helpers
export async function upsertStripeSubscription(opts: {
  userId: string;
  planId: string;
  amountCents: number;
  period: string;
  minutesIncluded: number;
  voicesIncluded: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: DbSubscription["status"];
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}): Promise<DbSubscription> {
  await ensureStripeColumns();
  const sql = getDb();

  const existing = await sql`SELECT id FROM subscriptions WHERE stripe_subscription_id = ${opts.stripeSubscriptionId} LIMIT 1`;

  if (existing.length > 0) {
    const id = (existing[0] as { id: string }).id;
    await sql`UPDATE subscriptions SET
      plan_id = ${opts.planId},
      amount_cents = ${opts.amountCents},
      period = ${opts.period},
      minutes_included = ${opts.minutesIncluded},
      voices_included = ${opts.voicesIncluded},
      stripe_customer_id = ${opts.stripeCustomerId},
      status = ${opts.status},
      current_period_start = ${opts.currentPeriodStart?.toISOString() ?? null},
      current_period_end = ${opts.currentPeriodEnd?.toISOString() ?? null}
      WHERE id = ${id}`;
    const rows = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;
    return rows[0] as DbSubscription;
  }

  const id = nanoid();
  await sql`INSERT INTO subscriptions
    (id, user_id, plan_id, amount_cents, period, minutes_included, voices_included,
     stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end)
    VALUES
    (${id}, ${opts.userId}, ${opts.planId}, ${opts.amountCents}, ${opts.period},
     ${opts.minutesIncluded}, ${opts.voicesIncluded},
     ${opts.stripeCustomerId}, ${opts.stripeSubscriptionId}, ${opts.status},
     ${opts.currentPeriodStart?.toISOString() ?? null},
     ${opts.currentPeriodEnd?.toISOString() ?? null})`;
  const rows = await sql`SELECT * FROM subscriptions WHERE id = ${id}`;
  return rows[0] as DbSubscription;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<DbSubscription | null> {
  await ensureStripeColumns();
  const sql = getDb();
  const rows = await sql`SELECT * FROM subscriptions WHERE stripe_subscription_id = ${stripeSubscriptionId} LIMIT 1`;
  return (rows[0] as DbSubscription) ?? null;
}

export async function updateSubscriptionStatusByStripeId(
  stripeSubscriptionId: string,
  status: DbSubscription["status"],
  currentPeriodEnd?: Date | null
) {
  await ensureStripeColumns();
  const sql = getDb();
  if (currentPeriodEnd !== undefined) {
    await sql`UPDATE subscriptions SET status = ${status}, current_period_end = ${currentPeriodEnd?.toISOString() ?? null}
      WHERE stripe_subscription_id = ${stripeSubscriptionId}`;
  } else {
    await sql`UPDATE subscriptions SET status = ${status}
      WHERE stripe_subscription_id = ${stripeSubscriptionId}`;
  }
}
