import { getDb } from "./index";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

export interface DbUser {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
  suspended_at: string | null;
}

export function createUser(email: string, name: string, password?: string): DbUser {
  const db = getDb();
  const id = nanoid();
  const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)`
  ).run(id, email, name, passwordHash);

  return getUserById(id)!;
}

export function getUserById(id: string): DbUser | null {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | null;
}

export function getUserByEmail(email: string): DbUser | null {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as DbUser | null;
}

export function verifyPassword(user: DbUser, password: string): boolean {
  if (!user.password_hash) return false;
  return bcrypt.compareSync(password, user.password_hash);
}

export function updateUser(id: string, updates: Partial<Pick<DbUser, "name" | "avatar_url" | "role" | "suspended_at">>) {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
  if (updates.avatar_url !== undefined) { fields.push("avatar_url = ?"); values.push(updates.avatar_url); }
  if (updates.role !== undefined) { fields.push("role = ?"); values.push(updates.role); }
  if (updates.suspended_at !== undefined) { fields.push("suspended_at = ?"); values.push(updates.suspended_at); }

  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function listUsers(page = 1, limit = 50): { users: DbUser[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * limit;
  const users = db.prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset) as DbUser[];
  const { total } = db.prepare("SELECT COUNT(*) as total FROM users").get() as { total: number };
  return { users, total };
}
