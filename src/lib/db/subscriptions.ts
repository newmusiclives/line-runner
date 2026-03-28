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

export function createSubscription(
  userId: string,
  planId: string,
  amountCents: number,
  period: string,
  minutesIncluded: number,
  voicesIncluded: number,
  manifestPaymentId?: string
): DbSubscription {
  const db = getDb();
  const id = nanoid();
  const now = new Date().toISOString();
  const periodEnd = new Date();
  if (period === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
  else if (period === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setDate(periodEnd.getDate() + 60); // one-time: 60 day access

  db.prepare(
    `INSERT INTO subscriptions (id, user_id, plan_id, amount_cents, period, minutes_included, voices_included, manifest_payment_id, current_period_start, current_period_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, planId, amountCents, period, minutesIncluded, voicesIncluded, manifestPaymentId || null, now, periodEnd.toISOString());

  return db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(id) as DbSubscription;
}

export function getActiveSubscription(userId: string): DbSubscription | null {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
  ).get(userId) as DbSubscription | null;
}

export function updateSubscriptionStatus(id: string, status: DbSubscription["status"]) {
  const db = getDb();
  db.prepare("UPDATE subscriptions SET status = ? WHERE id = ?").run(status, id);
}

export function incrementMinutesUsed(id: string, minutes: number) {
  const db = getDb();
  db.prepare("UPDATE subscriptions SET minutes_used = minutes_used + ? WHERE id = ?").run(minutes, id);
}

export function listAllSubscriptions(): DbSubscription[] {
  const db = getDb();
  return db.prepare("SELECT * FROM subscriptions ORDER BY created_at DESC").all() as DbSubscription[];
}
