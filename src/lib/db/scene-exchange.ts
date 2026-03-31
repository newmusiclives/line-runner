import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DbSceneExchangeSession {
  id: string;
  script_id: string;
  host_user_id: string;
  guest_user_id: string | null;
  status: "waiting" | "active" | "completed";
  host_character: string;
  guest_character: string | null;
  created_at: string;
}

export interface SceneExchangeWithDetails extends DbSceneExchangeSession {
  script_title: string;
  host_name: string;
  guest_name: string | null;
}

export async function createSceneExchangeSession(
  scriptId: string,
  hostUserId: string,
  hostCharacter: string,
  guestCharacter: string
): Promise<DbSceneExchangeSession> {
  const sql = getDb();
  const id = nanoid();
  await sql`
    INSERT INTO scene_exchange_sessions (id, script_id, host_user_id, host_character, guest_character, status)
    VALUES (${id}, ${scriptId}, ${hostUserId}, ${hostCharacter}, ${guestCharacter}, 'waiting')
  `;
  return (await getSceneExchangeSessionById(id))!;
}

export async function getSceneExchangeSessionById(
  id: string
): Promise<SceneExchangeWithDetails | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT ses.*, s.title as script_title,
           hu.name as host_name,
           gu.name as guest_name
    FROM scene_exchange_sessions ses
    JOIN scripts s ON ses.script_id = s.id
    JOIN users hu ON ses.host_user_id = hu.id
    LEFT JOIN users gu ON ses.guest_user_id = gu.id
    WHERE ses.id = ${id}
  `;
  return (rows[0] as SceneExchangeWithDetails) ?? null;
}

export async function listWaitingSceneExchangeSessions(): Promise<
  SceneExchangeWithDetails[]
> {
  const sql = getDb();
  const rows = await sql`
    SELECT ses.*, s.title as script_title,
           hu.name as host_name,
           gu.name as guest_name
    FROM scene_exchange_sessions ses
    JOIN scripts s ON ses.script_id = s.id
    JOIN users hu ON ses.host_user_id = hu.id
    LEFT JOIN users gu ON ses.guest_user_id = gu.id
    WHERE ses.status IN ('waiting', 'active')
    ORDER BY ses.created_at DESC
  `;
  return rows as SceneExchangeWithDetails[];
}

export async function joinSceneExchangeSession(
  sessionId: string,
  guestUserId: string
): Promise<SceneExchangeWithDetails | null> {
  const sql = getDb();
  await sql`
    UPDATE scene_exchange_sessions
    SET guest_user_id = ${guestUserId}, status = 'active'
    WHERE id = ${sessionId} AND status = 'waiting'
  `;
  return getSceneExchangeSessionById(sessionId);
}

export async function leaveSceneExchangeSession(
  sessionId: string,
  userId: string
): Promise<SceneExchangeWithDetails | null> {
  const sql = getDb();
  const session = await getSceneExchangeSessionById(sessionId);
  if (!session) return null;

  if (session.host_user_id === userId) {
    // Host leaves -> complete/cancel the session
    await sql`
      UPDATE scene_exchange_sessions SET status = 'completed' WHERE id = ${sessionId}
    `;
  } else if (session.guest_user_id === userId) {
    // Guest leaves -> set back to waiting
    await sql`
      UPDATE scene_exchange_sessions
      SET guest_user_id = NULL, status = 'waiting'
      WHERE id = ${sessionId}
    `;
  }
  return getSceneExchangeSessionById(sessionId);
}
