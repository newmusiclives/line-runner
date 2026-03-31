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
    SELECT id, project_name, character_name, pitch_center, tempo, resonance, sessions, created_at, updated_at
    FROM voice_profiles
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return Response.json({ profiles: rows });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { project_name, character_name, pitch_center, tempo, resonance, sessions } = body;

  if (!project_name || !character_name) {
    return Response.json({ error: "project_name and character_name are required" }, { status: 400 });
  }

  const id = nanoid();
  const sessionsJson = JSON.stringify(sessions || []);
  await sql`
    INSERT INTO voice_profiles (id, user_id, project_name, character_name, pitch_center, tempo, resonance, sessions, created_at, updated_at)
    VALUES (${id}, ${userId}, ${project_name}, ${character_name}, ${pitch_center || 0}, ${tempo || 0}, ${resonance || ""}, ${sessionsJson}::jsonb, NOW(), NOW())
  `;

  return Response.json({ id, project_name, character_name });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { id, pitch_center, tempo, resonance, sessions } = body;

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const sessionsJson = JSON.stringify(sessions || []);
  await sql`
    UPDATE voice_profiles
    SET pitch_center = ${pitch_center || 0}, tempo = ${tempo || 0}, resonance = ${resonance || ""},
        sessions = ${sessionsJson}::jsonb, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;

  return Response.json({ success: true });
}
