import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DashboardKPIs {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
  scriptsUploaded: number;
  avgSessionDuration: number;
  newUsersThisWeek: number;
  totalSessions: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const sql = getDb();

  const [r1, r2, r3, r4, r5, r6, r7, r8] = await Promise.all([
    sql`SELECT COUNT(*) as val FROM users`,
    sql`SELECT COUNT(*) as val FROM subscriptions WHERE status = 'active'`,
    sql`SELECT COALESCE(SUM(amount_cents), 0) as val FROM subscriptions WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(amount_cents), 0) as val FROM subscriptions`,
    sql`SELECT COUNT(*) as val FROM scripts`,
    sql`SELECT COALESCE(AVG(duration_secs), 0) as val FROM rehearsal_sessions WHERE ended_at IS NOT NULL`,
    sql`SELECT COUNT(*) as val FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*) as val FROM rehearsal_sessions`,
  ]);

  return {
    totalUsers: Number(r1[0].val),
    activeSubscriptions: Number(r2[0].val),
    monthlyRevenue: Number(r3[0].val) / 100,
    totalRevenue: Number(r4[0].val) / 100,
    scriptsUploaded: Number(r5[0].val),
    avgSessionDuration: Math.round(Number(r6[0].val)),
    newUsersThisWeek: Number(r7[0].val),
    totalSessions: Number(r8[0].val),
  };
}

export async function getRevenueByDay(days = 30): Promise<{ date: string; revenue: number }[]> {
  const sql = getDb();
  const interval = `${days} days`;
  const rows = await sql`SELECT DATE(created_at) as date, SUM(amount_cents) / 100.0 as revenue
     FROM subscriptions WHERE created_at >= NOW() - ${interval}::interval
     GROUP BY DATE(created_at) ORDER BY date`;
  return rows as { date: string; revenue: number }[];
}

export async function getPlanDistribution(): Promise<{ plan_id: string; count: number }[]> {
  const sql = getDb();
  const rows = await sql`SELECT plan_id, COUNT(*) as count FROM subscriptions WHERE status = 'active' GROUP BY plan_id`;
  return rows as { plan_id: string; count: number }[];
}

export async function getFeatureFlags(): Promise<{ key: string; enabled: boolean; config: string | null }[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM feature_flags ORDER BY key`;
  return rows as { key: string; enabled: boolean; config: string | null }[];
}

export async function setFeatureFlag(key: string, enabled: boolean) {
  const sql = getDb();
  await sql`UPDATE feature_flags SET enabled = ${enabled}, updated_at = NOW() WHERE key = ${key}`;
}

export async function addAuditLog(adminId: string, action: string, targetType?: string, targetId?: string, details?: string) {
  const sql = getDb();
  await sql`INSERT INTO audit_log (id, admin_id, action, target_type, target_id, details) VALUES (${nanoid()}, ${adminId}, ${action}, ${targetType || null}, ${targetId || null}, ${details || null})`;
}

export async function getAuditLog(limit = 100): Promise<{ id: string; admin_id: string; action: string; target_type: string; target_id: string; details: string; created_at: string }[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${limit}`;
  return rows as any[];
}
