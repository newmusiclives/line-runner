import { getDb } from "@/lib/db";

export interface PerformanceStats {
  totalRehearsalMinutes: number;
  linesMastered: number;
  fluencyScore: number;
  sessionStreak: number;
  improvementDelta: number;
  totalSessions: number;
}

export async function getUserPerformanceStats(userId: string): Promise<PerformanceStats> {
  const sql = getDb();

  const [totalSecsRow, totalSessionsRow, linesMasteredRow, lastSessionRow, sessionsRows, mostRehearsedRow] = await Promise.all([
    sql`SELECT COALESCE(SUM(duration_secs), 0) as val FROM rehearsal_sessions WHERE user_id = ${userId}`,
    sql`SELECT COUNT(*) as val FROM rehearsal_sessions WHERE user_id = ${userId}`,
    sql`SELECT COUNT(*) as val FROM (
      SELECT lm.line_id FROM line_metrics lm
      JOIN rehearsal_sessions rs ON lm.session_id = rs.id
      WHERE rs.user_id = ${userId} AND lm.skipped = false AND lm.replayed = false
      GROUP BY lm.line_id HAVING COUNT(DISTINCT lm.session_id) >= 3
    ) sub`,
    sql`SELECT lines_completed, lines_total FROM rehearsal_sessions WHERE user_id = ${userId} ORDER BY started_at DESC LIMIT 1`,
    sql`SELECT DISTINCT DATE(started_at) as d FROM rehearsal_sessions WHERE user_id = ${userId} ORDER BY d DESC`,
    sql`SELECT script_id, COUNT(*) as cnt FROM rehearsal_sessions WHERE user_id = ${userId} GROUP BY script_id ORDER BY cnt DESC LIMIT 1`,
  ]);

  const totalSecs = Number(totalSecsRow[0].val);
  const totalSessions = Number(totalSessionsRow[0].val);
  const linesMastered = Number(linesMasteredRow[0]?.val ?? 0);

  const fluencyScore = lastSessionRow.length > 0 && Number(lastSessionRow[0].lines_total) > 0
    ? Math.round((Number(lastSessionRow[0].lines_completed) / Number(lastSessionRow[0].lines_total)) * 100)
    : 0;

  // Session streak
  let streak = 0;
  if (sessionsRows.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < sessionsRows.length; i++) {
      const sessionDate = new Date(sessionsRows[i].d as string);
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

  // Improvement delta
  let improvementDelta = 0;
  if (mostRehearsedRow.length > 0 && Number(mostRehearsedRow[0].cnt) >= 2) {
    const scriptId = mostRehearsedRow[0].script_id as string;
    const [firstRows, lastRows] = await Promise.all([
      sql`SELECT lines_completed, lines_total FROM rehearsal_sessions WHERE user_id = ${userId} AND script_id = ${scriptId} ORDER BY started_at ASC LIMIT 1`,
      sql`SELECT lines_completed, lines_total FROM rehearsal_sessions WHERE user_id = ${userId} AND script_id = ${scriptId} ORDER BY started_at DESC LIMIT 1`,
    ]);
    const first = firstRows[0];
    const last = lastRows[0];
    const firstFluency = Number(first.lines_total) > 0 ? (Number(first.lines_completed) / Number(first.lines_total)) * 100 : 0;
    const lastFluency = Number(last.lines_total) > 0 ? (Number(last.lines_completed) / Number(last.lines_total)) * 100 : 0;
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
