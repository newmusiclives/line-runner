import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DbActorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  voice_samples: string;
  tier1_price: number;
  tier2_price: number;
  tier3_price: number;
  subscriber_count: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface DbPassSubscription {
  id: string;
  fan_user_id: string;
  actor_user_id: string;
  tier: number;
  monthly_price: number;
  status: "active" | "cancelled" | "expired";
  started_at: string;
}

export async function listActorProfiles(
  search?: string
): Promise<DbActorProfile[]> {
  const sql = getDb();
  if (search) {
    const pattern = `%${search}%`;
    const rows = await sql`
      SELECT * FROM actor_profiles
      WHERE display_name ILIKE ${pattern} OR bio ILIKE ${pattern}
      ORDER BY subscriber_count DESC, created_at DESC
    `;
    return rows as DbActorProfile[];
  }
  const rows = await sql`
    SELECT * FROM actor_profiles
    ORDER BY subscriber_count DESC, created_at DESC
  `;
  return rows as DbActorProfile[];
}

export async function getActorProfileById(
  id: string
): Promise<DbActorProfile | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM actor_profiles WHERE id = ${id}`;
  return (rows[0] as DbActorProfile) ?? null;
}

export async function getActorProfileByUserId(
  userId: string
): Promise<DbActorProfile | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM actor_profiles WHERE user_id = ${userId}`;
  return (rows[0] as DbActorProfile) ?? null;
}

export async function createPassSubscription(
  fanUserId: string,
  actorUserId: string,
  tier: number,
  monthlyPrice: number
): Promise<DbPassSubscription> {
  const sql = getDb();
  const id = nanoid();
  await sql`
    INSERT INTO pass_subscriptions (id, fan_user_id, actor_user_id, tier, monthly_price, status)
    VALUES (${id}, ${fanUserId}, ${actorUserId}, ${tier}, ${monthlyPrice}, 'active')
  `;

  // Update actor profile subscriber count and earnings
  await sql`
    UPDATE actor_profiles
    SET subscriber_count = subscriber_count + 1,
        total_earnings = total_earnings + ${monthlyPrice},
        updated_at = NOW()
    WHERE user_id = ${actorUserId}
  `;

  // Record in earnings ledger
  const ledgerId = nanoid();
  await sql`
    INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description, reference_id)
    VALUES (${ledgerId}, ${actorUserId}, 'pass', ${monthlyPrice}, ${`PASS Tier ${tier} subscription`}, ${id})
  `;

  const rows = await sql`SELECT * FROM pass_subscriptions WHERE id = ${id}`;
  return rows[0] as DbPassSubscription;
}

export async function getActiveSubscription(
  fanUserId: string,
  actorUserId: string
): Promise<DbPassSubscription | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM pass_subscriptions
    WHERE fan_user_id = ${fanUserId} AND actor_user_id = ${actorUserId} AND status = 'active'
    LIMIT 1
  `;
  return (rows[0] as DbPassSubscription) ?? null;
}

export async function getUserSubscriptions(
  fanUserId: string
): Promise<(DbPassSubscription & { display_name: string })[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ps.*, ap.display_name
    FROM pass_subscriptions ps
    JOIN actor_profiles ap ON ps.actor_user_id = ap.user_id
    WHERE ps.fan_user_id = ${fanUserId} AND ps.status = 'active'
    ORDER BY ps.started_at DESC
  `;
  return rows as (DbPassSubscription & { display_name: string })[];
}
