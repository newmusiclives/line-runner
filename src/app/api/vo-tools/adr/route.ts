import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const rows = await sql`
    SELECT id, title, reference_url, takes, best_score, created_at, updated_at
    FROM adr_sessions
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return Response.json({ sessions: rows });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { title, reference_url, takes, best_score } = body;

  if (!title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const id = nanoid();
  const takesJson = JSON.stringify(takes || []);
  await sql`
    INSERT INTO adr_sessions (id, user_id, title, reference_url, takes, best_score, created_at, updated_at)
    VALUES (${id}, ${userId}, ${title}, ${reference_url || ""}, ${takesJson}::jsonb, ${best_score || 0}, NOW(), NOW())
  `;

  return Response.json({ id, title });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { id, takes, best_score } = body;

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const takesJson = JSON.stringify(takes || []);
  await sql`
    UPDATE adr_sessions
    SET takes = ${takesJson}::jsonb, best_score = ${best_score || 0}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;

  return Response.json({ success: true });
}
