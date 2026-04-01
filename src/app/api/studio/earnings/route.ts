import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/index";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "month";

  const sql = getDb();

  // Determine date cutoff
  const now = new Date();
  let cutoff: Date;
  if (range === "year") {
    cutoff = new Date(now.getFullYear(), 0, 1);
  } else if (range === "quarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    cutoff = new Date(now.getFullYear(), qMonth, 1);
  } else {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const cutoffStr = cutoff.toISOString();

  // Total earnings (all time)
  const totalRows = await sql`
    SELECT COALESCE(SUM(amount_cents), 0) as total
    FROM earnings_ledger WHERE user_id = ${userId}
  `;
  const totalEarnings = Number(totalRows[0]?.total || 0) / 100;

  // Earnings in period
  const periodRows = await sql`
    SELECT COALESCE(SUM(amount_cents), 0) as total
    FROM earnings_ledger WHERE user_id = ${userId} AND created_at >= ${cutoffStr}
  `;
  const periodEarnings = Number(periodRows[0]?.total || 0) / 100;

  // Earnings by stream in period
  const streamRows = await sql`
    SELECT source, COALESCE(SUM(amount_cents), 0) as total
    FROM earnings_ledger WHERE user_id = ${userId} AND created_at >= ${cutoffStr}
    GROUP BY source
  `;
  const streams: Record<string, number> = {
    masterclass: 0,
    pass: 0,
    delivery: 0,
    voiceLicensing: 0,
    coaching: 0,
  };
  for (const row of streamRows as any[]) {
    const key = row.source === "voice_licensing" ? "voiceLicensing" : row.source;
    streams[key] = Number(row.total) / 100;
  }

  // Recent transactions (last 20)
  const txRows = await sql`
    SELECT source, amount_cents, description, created_at
    FROM earnings_ledger WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 20
  `;
  const transactions = (txRows as any[]).map((r) => ({
    date: r.created_at,
    description: r.description || r.source,
    amount: Number(r.amount_cents) / 100,
    type: r.source === "voice_licensing" ? "voiceLicensing" : r.source,
  }));

  // Session analytics
  const sessionRows = await sql`
    SELECT COUNT(*) as total_sessions
    FROM rehearsal_sessions WHERE user_id = ${userId}
  `;
  const totalSessions = Number(sessionRows[0]?.total_sessions || 0);

  const mostRehearsedRows = await sql`
    SELECT s.title, COUNT(*) as cnt
    FROM rehearsal_sessions rs
    JOIN scripts s ON s.id = rs.script_id
    WHERE rs.user_id = ${userId}
    GROUP BY s.title
    ORDER BY cnt DESC LIMIT 1
  `;
  const mostRehearsed = (mostRehearsedRows[0] as any)?.title || "N/A";

  // PASS subscriber count
  const passRows = await sql`
    SELECT COUNT(*) as cnt FROM pass_subscriptions
    WHERE actor_user_id = ${userId} AND status = 'active'
  `;
  const fanCount = Number(passRows[0]?.cnt || 0);

  // Masterclass views (purchase count as proxy)
  const viewRows = await sql`
    SELECT COALESCE(SUM(ml.purchase_count), 0) as views
    FROM masterclass_listings ml WHERE ml.seller_id = ${userId}
  `;
  const contentViews = Number(viewRows[0]?.views || 0);

  return NextResponse.json({
    totalEarnings,
    periodEarnings,
    streams,
    transactions,
    analytics: {
      totalSessions,
      mostRehearsed,
      consistencyScore: totalSessions > 0 ? Math.min(100, Math.round((totalSessions / (totalSessions + 10)) * 100)) : 0,
      fanGrowth: fanCount,
      subscriberChurn: 0,
      contentViews,
    },
  });
}
