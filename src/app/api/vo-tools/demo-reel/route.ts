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
    SELECT id, title, segments, segment_order, created_at, updated_at
    FROM demo_reel_projects
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return Response.json({ projects: rows });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { title, segments, segment_order } = body;

  if (!title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const id = nanoid();
  const segmentsJson = JSON.stringify(segments || []);
  const orderJson = JSON.stringify(segment_order || []);
  await sql`
    INSERT INTO demo_reel_projects (id, user_id, title, segments, segment_order, created_at, updated_at)
    VALUES (${id}, ${userId}, ${title}, ${segmentsJson}::jsonb, ${orderJson}::jsonb, NOW(), NOW())
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
  const { id, title, segments, segment_order } = body;

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const segmentsJson = JSON.stringify(segments || []);
  const orderJson = JSON.stringify(segment_order || []);
  await sql`
    UPDATE demo_reel_projects
    SET title = ${title || ""}, segments = ${segmentsJson}::jsonb, segment_order = ${orderJson}::jsonb, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;

  return Response.json({ success: true });
}
