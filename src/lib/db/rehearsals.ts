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

export function startSession(userId: string, scriptId: string, myCharacter: string, linesTotal: number): DbRehearsalSession {
  const db = getDb();
  const id = nanoid();
  db.prepare(
    `INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, lines_total) VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, scriptId, myCharacter, linesTotal);
  return db.prepare("SELECT * FROM rehearsal_sessions WHERE id = ?").get(id) as DbRehearsalSession;
}

export function updateSession(id: string, updates: Partial<Pick<DbRehearsalSession, "ended_at" | "duration_secs" | "lines_completed" | "furthest_line" | "loop_count">>) {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE rehearsal_sessions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function getSession(id: string): DbRehearsalSession | null {
  const db = getDb();
  return db.prepare("SELECT * FROM rehearsal_sessions WHERE id = ?").get(id) as DbRehearsalSession | null;
}

export function listUserSessions(userId: string, limit = 50): (DbRehearsalSession & { script_title?: string })[] {
  const db = getDb();
  return db.prepare(
    `SELECT rs.*, s.title as script_title
     FROM rehearsal_sessions rs JOIN scripts s ON rs.script_id = s.id
     WHERE rs.user_id = ? ORDER BY rs.started_at DESC LIMIT ?`
  ).all(userId, limit) as (DbRehearsalSession & { script_title?: string })[];
}

export function saveLineMetrics(sessionId: string, metrics: { lineId: string; lineIndex: number; characterName: string; timingMs: number; skipped: boolean; replayed: boolean }[]) {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO line_metrics (id, session_id, line_id, line_index, character_name, timing_ms, skipped, replayed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction(() => {
    for (const m of metrics) {
      stmt.run(nanoid(), sessionId, m.lineId, m.lineIndex, m.characterName, m.timingMs, m.skipped ? 1 : 0, m.replayed ? 1 : 0);
    }
  });
  tx();
}

export function getSessionMetrics(sessionId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM line_metrics WHERE session_id = ? ORDER BY line_index").all(sessionId);
}
