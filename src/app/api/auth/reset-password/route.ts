import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcryptjs from "bcryptjs";

export async function POST(request: Request) {
  const { token, password } = await request.json();
  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const sql = getDb();

  // Find valid token
  const tokens = await sql`
    SELECT t.id, t.user_id, t.expires_at, t.used, u.email, u.name
    FROM password_reset_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE t.token = ${token}
    LIMIT 1
  `;

  if (tokens.length === 0) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const resetToken = tokens[0] as { id: string; user_id: string; expires_at: string; used: boolean };

  if (resetToken.used) {
    return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 });
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "This reset link has expired" }, { status: 400 });
  }

  // Hash new password and update
  const passwordHash = await bcryptjs.hash(password, 10);
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${resetToken.user_id}`;

  // Mark token as used
  await sql`UPDATE password_reset_tokens SET used = true WHERE id = ${resetToken.id}`;

  return NextResponse.json({ success: true });
}
