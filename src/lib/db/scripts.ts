import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DbScript {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_path: string | null;
  raw_text: string | null;
  parsed_data: string;
  status: "active" | "flagged" | "removed";
  created_at: string;
  updated_at: string;
}

export async function createScript(userId: string, title: string, fileName: string, rawText: string, parsedData: string, filePath?: string): Promise<DbScript> {
  const sql = getDb();
  const id = nanoid();
  await sql`INSERT INTO scripts (id, user_id, title, file_name, file_path, raw_text, parsed_data) VALUES (${id}, ${userId}, ${title}, ${fileName}, ${filePath || null}, ${rawText}, ${parsedData})`;
  return (await getScriptById(id))!;
}

export async function getScriptById(id: string): Promise<DbScript | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM scripts WHERE id = ${id}`;
  return (rows[0] as DbScript) ?? null;
}

export async function listUserScripts(userId: string): Promise<DbScript[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM scripts WHERE user_id = ${userId} AND status = 'active' ORDER BY created_at DESC`;
  return rows as DbScript[];
}

export async function updateScriptStatus(id: string, status: DbScript["status"]) {
  const sql = getDb();
  await sql`UPDATE scripts SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
}

export async function deleteScript(id: string) {
  const sql = getDb();
  await sql`DELETE FROM scripts WHERE id = ${id}`;
}

export async function listAllScripts(page = 1, limit = 50): Promise<{ scripts: (DbScript & { user_email?: string; user_name?: string })[]; total: number }> {
  const sql = getDb();
  const offset = (page - 1) * limit;
  const scripts = await sql`SELECT s.*, u.email as user_email, u.name as user_name
     FROM scripts s JOIN users u ON s.user_id = u.id
     ORDER BY s.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const totalRow = await sql`SELECT COUNT(*) as total FROM scripts`;
  return { scripts: scripts as (DbScript & { user_email?: string; user_name?: string })[], total: Number(totalRow[0].total) };
}

// Voice assignments
export async function saveVoiceAssignments(scriptId: string, assignments: { characterName: string; voiceConfig: string }[]) {
  const sql = getDb();
  await sql`DELETE FROM voice_assignments WHERE script_id = ${scriptId}`;
  for (const a of assignments) {
    await sql`INSERT INTO voice_assignments (id, script_id, character_name, voice_config) VALUES (${nanoid()}, ${scriptId}, ${a.characterName}, ${a.voiceConfig})`;
  }
}

export async function getVoiceAssignments(scriptId: string): Promise<{ character_name: string; voice_config: string }[]> {
  const sql = getDb();
  const rows = await sql`SELECT character_name, voice_config FROM voice_assignments WHERE script_id = ${scriptId}`;
  return rows as { character_name: string; voice_config: string }[];
}

let _lastCharacterColumnEnsured = false;
async function ensureLastCharacterColumn() {
  if (_lastCharacterColumnEnsured) return;
  const sql = getDb();
  await sql`ALTER TABLE scripts ADD COLUMN IF NOT EXISTS last_character TEXT`;
  _lastCharacterColumnEnsured = true;
}

export async function setLastCharacter(scriptId: string, characterName: string) {
  await ensureLastCharacterColumn();
  const sql = getDb();
  await sql`UPDATE scripts SET last_character = ${characterName}, updated_at = NOW() WHERE id = ${scriptId}`;
}

export async function getLastCharacter(scriptId: string): Promise<string | null> {
  await ensureLastCharacterColumn();
  const sql = getDb();
  const rows = await sql`SELECT last_character FROM scripts WHERE id = ${scriptId} LIMIT 1`;
  return ((rows[0] as { last_character?: string | null })?.last_character) || null;
}

// Favorites
export async function toggleFavorite(userId: string, scriptId: string): Promise<boolean> {
  const sql = getDb();
  const existing = await sql`SELECT 1 FROM favorites WHERE user_id = ${userId} AND script_id = ${scriptId}`;
  if (existing.length > 0) {
    await sql`DELETE FROM favorites WHERE user_id = ${userId} AND script_id = ${scriptId}`;
    return false;
  } else {
    await sql`INSERT INTO favorites (user_id, script_id) VALUES (${userId}, ${scriptId})`;
    return true;
  }
}

export async function getUserFavorites(userId: string): Promise<string[]> {
  const sql = getDb();
  const rows = await sql`SELECT script_id FROM favorites WHERE user_id = ${userId}`;
  return rows.map((r: any) => r.script_id);
}

// Annotations
export async function getAnnotations(scriptId: string, userId: string) {
  const sql = getDb();
  return await sql`SELECT * FROM annotations WHERE script_id = ${scriptId} AND user_id = ${userId} ORDER BY created_at`;
}

export async function createAnnotation(userId: string, scriptId: string, lineId: string, noteType: string, content: string) {
  const sql = getDb();
  const id = nanoid();
  await sql`INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES (${id}, ${userId}, ${scriptId}, ${lineId}, ${noteType}, ${content})`;
  return id;
}

export async function deleteAnnotation(id: string, userId: string) {
  const sql = getDb();
  await sql`DELETE FROM annotations WHERE id = ${id} AND user_id = ${userId}`;
}

// Bookmarks
export async function getBookmarks(scriptId: string, userId: string) {
  const sql = getDb();
  return await sql`SELECT * FROM bookmarks WHERE script_id = ${scriptId} AND user_id = ${userId} ORDER BY start_line_idx`;
}

export async function createBookmark(userId: string, scriptId: string, label: string, startIdx: number, endIdx: number) {
  const sql = getDb();
  const id = nanoid();
  await sql`INSERT INTO bookmarks (id, user_id, script_id, label, start_line_idx, end_line_idx) VALUES (${id}, ${userId}, ${scriptId}, ${label}, ${startIdx}, ${endIdx})`;
  return id;
}

export async function deleteBookmark(id: string, userId: string) {
  const sql = getDb();
  await sql`DELETE FROM bookmarks WHERE id = ${id} AND user_id = ${userId}`;
}
