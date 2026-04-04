import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

async function ensureReferralTables() {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS referral_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS referral_tracking (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referred_id TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reward_credits INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureReferralTables();
  const sql = getDb();
  const userId = session.user.id;

  // Get or create referral code
  let codes = await sql`SELECT code FROM referral_codes WHERE user_id = ${userId}`;
  let code: string;

  if (codes.length === 0) {
    code = nanoid(8).toUpperCase();
    await sql`INSERT INTO referral_codes (id, user_id, code) VALUES (${nanoid()}, ${userId}, ${code})`;
  } else {
    code = (codes[0] as any).code;
  }

  // Get referral stats
  const referrals = await sql`SELECT status, COUNT(*) as count FROM referral_tracking WHERE referrer_id = ${userId} GROUP BY status`;
  const totalReferred = await sql`SELECT COUNT(*) as count FROM referral_tracking WHERE referrer_id = ${userId}`;
  const totalCredits = await sql`SELECT COALESCE(SUM(reward_credits), 0) as total FROM referral_tracking WHERE referrer_id = ${userId} AND status = 'completed'`;

  return NextResponse.json({
    code,
    referralLink: `https://rehearse-perform-earn.netlify.app/auth/register?ref=${code}`,
    stats: {
      total: Number((totalReferred[0] as any)?.count || 0),
      pending: Number((referrals.find((r: any) => r.status === "pending") as any)?.count || 0),
      completed: Number((referrals.find((r: any) => r.status === "completed") as any)?.count || 0),
      creditsEarned: Number((totalCredits[0] as any)?.total || 0),
    },
  });
}

// Track a referral when someone signs up
export async function POST(request: Request) {
  const { referredUserId, code } = await request.json();
  if (!referredUserId || !code) {
    return NextResponse.json({ error: "referredUserId and code required" }, { status: 400 });
  }

  await ensureReferralTables();
  const sql = getDb();

  // Look up referrer
  const codes = await sql`SELECT user_id FROM referral_codes WHERE code = ${code}`;
  if (codes.length === 0) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const referrerId = (codes[0] as any).user_id;

  // Don't allow self-referral
  if (referrerId === referredUserId) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Check for duplicate
  const existing = await sql`SELECT id FROM referral_tracking WHERE referred_id = ${referredUserId}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Already referred" }, { status: 400 });
  }

  await sql`INSERT INTO referral_tracking (id, referrer_id, referred_id, code) VALUES (${nanoid()}, ${referrerId}, ${referredUserId}, ${code})`;

  return NextResponse.json({ success: true });
}
