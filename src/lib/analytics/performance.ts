import { getDb } from "@/lib/db";

export interface PerformanceStats {
  totalRehearsalMinutes: number;
  linesMastered: number;
  fluencyScore: number;
  sessionStreak: number;
  improvementDelta: number;
  totalSessions: number;
}

export function getUserPerformanceStats(userId: string): PerformanceStats {
  const db = getDb();

  // Total rehearsal time
  const { totalSecs } = db.prepare(
    "SELECT COALESCE(SUM(duration_secs), 0) as totalSecs FROM rehearsal_sessions WHERE user_id = ?"
  ).get(userId) as { totalSecs: number };

  // Total sessions
  const { totalSessions } = db.prepare(
    "SELECT COUNT(*) as totalSessions FROM rehearsal_sessions WHERE user_id = ?"
  ).get(userId) as { totalSessions: number };

  // Lines mastered (completed without skip in 3+ sessions)
  const { linesMastered } = db.prepare(
    `SELECT COUNT(DISTINCT lm.line_id) as linesMastered
     FROM line_metrics lm
     JOIN rehearsal_sessions rs ON lm.session_id = rs.id
     WHERE rs.user_id = ? AND lm.skipped = 0 AND lm.replayed = 0
     GROUP BY lm.line_id HAVING COUNT(DISTINCT lm.session_id) >= 3`
  ).get(userId) as { linesMastered: number } || { linesMastered: 0 };

  // Fluency score (last session)
  const lastSession = db.prepare(
    "SELECT * FROM rehearsal_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 1"
  ).get(userId) as { lines_completed: number; lines_total: number } | undefined;

  const fluencyScore = lastSession && lastSession.lines_total > 0
    ? Math.round((lastSession.lines_completed / lastSession.lines_total) * 100)
    : 0;

  // Session streak (consecutive days)
  const sessions = db.prepare(
    "SELECT DISTINCT date(started_at) as d FROM rehearsal_sessions WHERE user_id = ? ORDER BY d DESC"
  ).all(userId) as { d: string }[];

  let streak = 0;
  if (sessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].d);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Improvement delta (first vs last session fluency for most-rehearsed script)
  let improvementDelta = 0;
  const mostRehearsed = db.prepare(
    `SELECT script_id, COUNT(*) as cnt FROM rehearsal_sessions WHERE user_id = ? GROUP BY script_id ORDER BY cnt DESC LIMIT 1`
  ).get(userId) as { script_id: string; cnt: number } | undefined;

  if (mostRehearsed && mostRehearsed.cnt >= 2) {
    const first = db.prepare(
      "SELECT lines_completed, lines_total FROM rehearsal_sessions WHERE user_id = ? AND script_id = ? ORDER BY started_at ASC LIMIT 1"
    ).get(userId, mostRehearsed.script_id) as { lines_completed: number; lines_total: number };
    const last = db.prepare(
      "SELECT lines_completed, lines_total FROM rehearsal_sessions WHERE user_id = ? AND script_id = ? ORDER BY started_at DESC LIMIT 1"
    ).get(userId, mostRehearsed.script_id) as { lines_completed: number; lines_total: number };

    const firstFluency = first.lines_total > 0 ? (first.lines_completed / first.lines_total) * 100 : 0;
    const lastFluency = last.lines_total > 0 ? (last.lines_completed / last.lines_total) * 100 : 0;
    improvementDelta = Math.round(lastFluency - firstFluency);
  }

  return {
    totalRehearsalMinutes: Math.round(totalSecs / 60),
    linesMastered,
    fluencyScore,
    sessionStreak: streak,
    improvementDelta,
    totalSessions,
  };
}
