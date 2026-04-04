import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export async function ensureSignalingTable() {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS webrtc_signals (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    from_user TEXT NOT NULL,
    to_user TEXT,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    consumed BOOLEAN DEFAULT false
  )`;
  // Auto-cleanup signals older than 5 minutes
  await sql`DELETE FROM webrtc_signals WHERE created_at < NOW() - INTERVAL '5 minutes'`;
}

export async function postSignal(
  roomId: string,
  fromUser: string,
  toUser: string | null,
  type: string,
  payload: string
) {
  const sql = getDb();
  await sql`INSERT INTO webrtc_signals (id, room_id, from_user, to_user, type, payload)
    VALUES (${nanoid()}, ${roomId}, ${fromUser}, ${toUser}, ${type}, ${payload})`;
}

export async function getSignals(roomId: string, forUser: string) {
  const sql = getDb();
  const rows = await sql`SELECT id, from_user, type, payload, created_at
    FROM webrtc_signals
    WHERE room_id = ${roomId}
    AND (to_user = ${forUser} OR to_user IS NULL)
    AND from_user != ${forUser}
    AND consumed = false
    ORDER BY created_at ASC
    LIMIT 20`;

  // Mark as consumed
  if (rows.length > 0) {
    const ids = rows.map((r: any) => r.id);
    for (const id of ids) {
      await sql`UPDATE webrtc_signals SET consumed = true WHERE id = ${id}`;
    }
  }

  return rows;
}
