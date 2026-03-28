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

export function createScript(userId: string, title: string, fileName: string, rawText: string, parsedData: string, filePath?: string): DbScript {
  const db = getDb();
  const id = nanoid();
  db.prepare(
    `INSERT INTO scripts (id, user_id, title, file_name, file_path, raw_text, parsed_data) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, title, fileName, filePath || null, rawText, parsedData);
  return getScriptById(id)!;
}

export function getScriptById(id: string): DbScript | null {
  const db = getDb();
  return db.prepare("SELECT * FROM scripts WHERE id = ?").get(id) as DbScript | null;
}

export function listUserScripts(userId: string): DbScript[] {
  const db = getDb();
  return db.prepare("SELECT * FROM scripts WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC").all(userId) as DbScript[];
}

export function updateScriptStatus(id: string, status: DbScript["status"]) {
  const db = getDb();
  db.prepare("UPDATE scripts SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export function deleteScript(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM scripts WHERE id = ?").run(id);
}

export function listAllScripts(page = 1, limit = 50): { scripts: (DbScript & { user_email?: string; user_name?: string })[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * limit;
  const scripts = db.prepare(
    `SELECT s.*, u.email as user_email, u.name as user_name
     FROM scripts s JOIN users u ON s.user_id = u.id
     ORDER BY s.created_at DESC LIMIT ? OFFSET ?`
  ).all(limit, offset) as (DbScript & { user_email?: string; user_name?: string })[];
  const { total } = db.prepare("SELECT COUNT(*) as total FROM scripts").get() as { total: number };
  return { scripts, total };
}

// Voice assignments
export function saveVoiceAssignments(scriptId: string, assignments: { characterName: string; voiceConfig: string }[]) {
  const db = getDb();
  const del = db.prepare("DELETE FROM voice_assignments WHERE script_id = ?");
  const ins = db.prepare("INSERT INTO voice_assignments (id, script_id, character_name, voice_config) VALUES (?, ?, ?, ?)");
  const tx = db.transaction(() => {
    del.run(scriptId);
    for (const a of assignments) {
      ins.run(nanoid(), scriptId, a.characterName, a.voiceConfig);
    }
  });
  tx();
}

export function getVoiceAssignments(scriptId: string): { character_name: string; voice_config: string }[] {
  const db = getDb();
  return db.prepare("SELECT character_name, voice_config FROM voice_assignments WHERE script_id = ?").all(scriptId) as { character_name: string; voice_config: string }[];
}

// Favorites
export function toggleFavorite(userId: string, scriptId: string): boolean {
  const db = getDb();
  const existing = db.prepare("SELECT 1 FROM favorites WHERE user_id = ? AND script_id = ?").get(userId, scriptId);
  if (existing) {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND script_id = ?").run(userId, scriptId);
    return false;
  } else {
    db.prepare("INSERT INTO favorites (user_id, script_id) VALUES (?, ?)").run(userId, scriptId);
    return true;
  }
}

export function getUserFavorites(userId: string): string[] {
  const db = getDb();
  return (db.prepare("SELECT script_id FROM favorites WHERE user_id = ?").all(userId) as { script_id: string }[]).map(r => r.script_id);
}

// Annotations
export function getAnnotations(scriptId: string, userId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM annotations WHERE script_id = ? AND user_id = ? ORDER BY created_at").all(scriptId, userId);
}

export function createAnnotation(userId: string, scriptId: string, lineId: string, noteType: string, content: string) {
  const db = getDb();
  const id = nanoid();
  db.prepare("INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES (?, ?, ?, ?, ?, ?)").run(id, userId, scriptId, lineId, noteType, content);
  return id;
}

export function deleteAnnotation(id: string, userId: string) {
  const db = getDb();
  db.prepare("DELETE FROM annotations WHERE id = ? AND user_id = ?").run(id, userId);
}

// Bookmarks
export function getBookmarks(scriptId: string, userId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM bookmarks WHERE script_id = ? AND user_id = ? ORDER BY start_line_idx").all(scriptId, userId);
}

export function createBookmark(userId: string, scriptId: string, label: string, startIdx: number, endIdx: number) {
  const db = getDb();
  const id = nanoid();
  db.prepare("INSERT INTO bookmarks (id, user_id, script_id, label, start_line_idx, end_line_idx) VALUES (?, ?, ?, ?, ?, ?)").run(id, userId, scriptId, label, startIdx, endIdx);
  return id;
}

export function deleteBookmark(id: string, userId: string) {
  const db = getDb();
  db.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?").run(id, userId);
}
