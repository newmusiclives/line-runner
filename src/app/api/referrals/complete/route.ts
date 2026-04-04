import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const { referredUserId } = await request.json();
  if (!referredUserId) {
    return NextResponse.json({ error: "referredUserId required" }, { status: 400 });
  }

  const sql = getDb();
  const REWARD_MINUTES = 10; // 10 minutes of voice credits as reward

  // Find pending referral
  const refs = await sql`SELECT id, referrer_id FROM referral_tracking WHERE referred_id = ${referredUserId} AND status = 'pending' LIMIT 1`;
  if (refs.length === 0) {
    return NextResponse.json({ ok: true, message: "No pending referral" });
  }

  const ref = refs[0] as { id: string; referrer_id: string };

  // Mark as completed and set reward
  await sql`UPDATE referral_tracking SET status = 'completed', reward_credits = ${REWARD_MINUTES} WHERE id = ${ref.id}`;

  // Add reward minutes to referrer's subscription
  await sql`UPDATE subscriptions SET minutes_included = minutes_included + ${REWARD_MINUTES} WHERE user_id = ${ref.referrer_id} AND status = 'active'`;

  return NextResponse.json({ success: true, reward: REWARD_MINUTES });
}
