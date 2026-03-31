import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DbRehearsalSession {
  id: string;
  user_id: string;
  script_id: string;
  my_character: string;
  started_at: string;
  ended_at: string | null;
  duration_secs: number;
  lines_total: number;
  lines_completed: number;
  furthest_line: number;
  loop_count: number;
}

export async function startSession(userId: string, scriptId: string, myCharacter: string, linesTotal: number): Promise<DbRehearsalSession> {
  const sql = getDb();
  const id = nanoid();
  await sql`INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, lines_total) VALUES (${id}, ${userId}, ${scriptId}, ${myCharacter}, ${linesTotal})`;
  const rows = await sql`SELECT * FROM rehearsal_sessions WHERE id = ${id}`;
  return rows[0] as DbRehearsalSession;
}

export async function updateSession(id: string, updates: Partial<Pick<DbRehearsalSession, "ended_at" | "duration_secs" | "lines_completed" | "furthest_line" | "loop_count">>) {
  const sql = getDb();
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(val);
    }
  }
  if (setClauses.length === 0) return;
  values.push(id);
  const query = `UPDATE rehearsal_sessions SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`;
  await (sql as any)(query, values);
}

export async function getSession(id: string): Promise<DbRehearsalSession | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM rehearsal_sessions WHERE id = ${id}`;
  return (rows[0] as DbRehearsalSession) ?? null;
}

export async function listUserSessions(userId: string, limit = 50): Promise<(DbRehearsalSession & { script_title?: string })[]> {
  const sql = getDb();
  const rows = await sql`SELECT rs.*, s.title as script_title
     FROM rehearsal_sessions rs JOIN scripts s ON rs.script_id = s.id
     WHERE rs.user_id = ${userId} ORDER BY rs.started_at DESC LIMIT ${limit}`;
  return rows as (DbRehearsalSession & { script_title?: string })[];
}

export async function saveLineMetrics(sessionId: string, metrics: { lineId: string; lineIndex: number; characterName: string; timingMs: number; skipped: boolean; replayed: boolean }[]) {
  const sql = getDb();
  for (const m of metrics) {
    await sql`INSERT INTO line_metrics (id, session_id, line_id, line_index, character_name, timing_ms, skipped, replayed) VALUES (${nanoid()}, ${sessionId}, ${m.lineId}, ${m.lineIndex}, ${m.characterName}, ${m.timingMs}, ${m.skipped}, ${m.replayed})`;
  }
}

export async function getSessionMetrics(sessionId: string) {
  const sql = getDb();
  return await sql`SELECT * FROM line_metrics WHERE session_id = ${sessionId} ORDER BY line_index`;
}
