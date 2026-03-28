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

export function getDashboardKPIs(): DashboardKPIs {
  const db = getDb();

  const { totalUsers } = db.prepare("SELECT COUNT(*) as totalUsers FROM users").get() as { totalUsers: number };
  const { activeSubscriptions } = db.prepare("SELECT COUNT(*) as activeSubscriptions FROM subscriptions WHERE status = 'active'").get() as { activeSubscriptions: number };
  const { monthlyRevenue } = db.prepare(
    "SELECT COALESCE(SUM(amount_cents), 0) as monthlyRevenue FROM subscriptions WHERE created_at >= datetime('now', '-30 days')"
  ).get() as { monthlyRevenue: number };
  const { totalRevenue } = db.prepare("SELECT COALESCE(SUM(amount_cents), 0) as totalRevenue FROM subscriptions").get() as { totalRevenue: number };
  const { scriptsUploaded } = db.prepare("SELECT COUNT(*) as scriptsUploaded FROM scripts").get() as { scriptsUploaded: number };
  const { avgSessionDuration } = db.prepare(
    "SELECT COALESCE(AVG(duration_secs), 0) as avgSessionDuration FROM rehearsal_sessions WHERE ended_at IS NOT NULL"
  ).get() as { avgSessionDuration: number };
  const { newUsersThisWeek } = db.prepare(
    "SELECT COUNT(*) as newUsersThisWeek FROM users WHERE created_at >= datetime('now', '-7 days')"
  ).get() as { newUsersThisWeek: number };
  const { totalSessions } = db.prepare("SELECT COUNT(*) as totalSessions FROM rehearsal_sessions").get() as { totalSessions: number };

  return {
    totalUsers,
    activeSubscriptions,
    monthlyRevenue: monthlyRevenue / 100,
    totalRevenue: totalRevenue / 100,
    scriptsUploaded,
    avgSessionDuration: Math.round(avgSessionDuration),
    newUsersThisWeek,
    totalSessions,
  };
}

export function getRevenueByDay(days = 30): { date: string; revenue: number }[] {
  const db = getDb();
  return db.prepare(
    `SELECT date(created_at) as date, SUM(amount_cents) / 100.0 as revenue
     FROM subscriptions WHERE created_at >= datetime('now', '-${days} days')
     GROUP BY date(created_at) ORDER BY date`
  ).all() as { date: string; revenue: number }[];
}

export function getPlanDistribution(): { plan_id: string; count: number }[] {
  const db = getDb();
  return db.prepare(
    "SELECT plan_id, COUNT(*) as count FROM subscriptions WHERE status = 'active' GROUP BY plan_id"
  ).all() as { plan_id: string; count: number }[];
}

export function getFeatureFlags(): { key: string; enabled: number; config: string | null }[] {
  const db = getDb();
  return db.prepare("SELECT * FROM feature_flags ORDER BY key").all() as { key: string; enabled: number; config: string | null }[];
}

export function setFeatureFlag(key: string, enabled: boolean) {
  const db = getDb();
  db.prepare("UPDATE feature_flags SET enabled = ?, updated_at = datetime('now') WHERE key = ?").run(enabled ? 1 : 0, key);
}

export function addAuditLog(adminId: string, action: string, targetType?: string, targetId?: string, details?: string) {
  const db = getDb();
  db.prepare("INSERT INTO audit_log (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)").run(nanoid(), adminId, action, targetType || null, targetId || null, details || null);
}

export function getAuditLog(limit = 100): { id: string; admin_id: string; action: string; target_type: string; target_id: string; details: string; created_at: string }[] {
  const db = getDb();
  return db.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
}
