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

export async function createUser(email: string, name: string, password?: string): Promise<DbUser> {
  const sql = getDb();
  const id = nanoid();
  const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

  await sql`INSERT INTO users (id, email, name, password_hash) VALUES (${id}, ${email}, ${name}, ${passwordHash})`;

  return (await getUserById(id))!;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return (rows[0] as DbUser) ?? null;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return (rows[0] as DbUser) ?? null;
}

export function verifyPassword(user: DbUser, password: string): boolean {
  if (!user.password_hash) return false;
  return bcrypt.compareSync(password, user.password_hash);
}

export async function updateUser(id: string, updates: Partial<Pick<DbUser, "name" | "avatar_url" | "role" | "suspended_at">>) {
  const sql = getDb();
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) { setClauses.push(`name = $${paramIndex++}`); values.push(updates.name); }
  if (updates.avatar_url !== undefined) { setClauses.push(`avatar_url = $${paramIndex++}`); values.push(updates.avatar_url); }
  if (updates.role !== undefined) { setClauses.push(`role = $${paramIndex++}`); values.push(updates.role); }
  if (updates.suspended_at !== undefined) { setClauses.push(`suspended_at = $${paramIndex++}`); values.push(updates.suspended_at); }

  if (setClauses.length === 0) return;
  setClauses.push("updated_at = NOW()");
  values.push(id);

  const query = `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`;
  await (sql as any)(query, values);
}

export async function listUsers(page = 1, limit = 50): Promise<{ users: DbUser[]; total: number }> {
  const sql = getDb();
  const offset = (page - 1) * limit;
  const users = await sql`SELECT * FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const totalRow = await sql`SELECT COUNT(*) as total FROM users`;
  return { users: users as DbUser[], total: Number(totalRow[0].total) };
}
