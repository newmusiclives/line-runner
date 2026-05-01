import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { allowed } = checkRateLimit(`forgot:${email}`, 3, 900000);
  if (!allowed) {
    return NextResponse.json({ success: true }); // Don't reveal rate limiting
  }

  const sql = getDb();

  // Always return success to prevent email enumeration
  const users = await sql`SELECT id, name, email FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) {
    return NextResponse.json({ success: true });
  }

  const user = users[0] as { id: string; name: string; email: string };
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  // Ensure table exists
  await sql`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TEXT DEFAULT (now())
  )`;

  // Delete old tokens for this user
  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`;

  // Create new token
  const id = nanoid();
  await sql`INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
    VALUES (${id}, ${user.id}, ${token}, ${expiresAt})`;

  // Build reset link
  const baseUrl = process.env.NEXTAUTH_URL || "https://rehearse-perform-earn.netlify.app";
  const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

  // Send email — always return success to prevent enumeration, but log failures
  // server-side so they show up in Netlify function logs.
  const { subject, html } = passwordResetEmail(resetLink, user.name || "there");
  const sent = await sendEmail({ to: email, subject, html });
  if (!sent) {
    console.error(
      `[forgot-password] Reset email could not be delivered to ${email}. Token created but the user will not see it.`
    );
  }

  return NextResponse.json({ success: true });
}
