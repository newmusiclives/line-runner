import { getDb } from "./index";

// Cross-device remote control commands, persisted so they survive across
// serverless instances (an in-memory Map does not: the phone's POST and the
// laptop's poll can land on different lambdas). One row per session — each new
// command overwrites the previous one, and the laptop polls by `since`.

export type ControlCommand =
  | "play"
  | "pause"
  | "resume"
  | "stop"
  | "restart"
  | "next"
  | "prev";

let tableReady: Promise<void> | null = null;

export function ensureControlTable(): Promise<void> {
  if (!tableReady) {
    const sql = getDb();
    tableReady = sql`CREATE TABLE IF NOT EXISTS rehearsal_control (
      session_id TEXT PRIMARY KEY,
      command    TEXT NOT NULL,
      ts         BIGINT NOT NULL
    )`.then(() => undefined);
    // If the create fails, allow a later call to retry rather than caching the
    // rejection forever.
    tableReady.catch(() => { tableReady = null; });
  }
  return tableReady;
}

export async function setControlCommand(
  sessionId: string,
  command: ControlCommand,
  ts: number
): Promise<void> {
  await ensureControlTable();
  const sql = getDb();
  await sql`INSERT INTO rehearsal_control (session_id, command, ts)
    VALUES (${sessionId}, ${command}, ${ts})
    ON CONFLICT (session_id) DO UPDATE SET command = ${command}, ts = ${ts}`;
}

export async function getControlCommandSince(
  sessionId: string,
  since: number
): Promise<{ command: ControlCommand; timestamp: number } | null> {
  await ensureControlTable();
  const sql = getDb();
  const rows = await sql`SELECT command, ts FROM rehearsal_control
    WHERE session_id = ${sessionId} AND ts > ${since}
    LIMIT 1`;
  const row = rows[0] as { command: ControlCommand; ts: string | number } | undefined;
  if (!row) return null;
  return { command: row.command, timestamp: Number(row.ts) };
}
