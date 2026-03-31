import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DbSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "past_due" | "expired";
  manifest_payment_id: string | null;
  manifest_sub_id: string | null;
  amount_cents: number;
  period: string;
  minutes_included: number;
  minutes_used: number;
  voices_included: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
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
