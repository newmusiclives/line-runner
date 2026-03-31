import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const userId = (session.user as any).id;
  const rows = await sql`
    SELECT * FROM voice_print_sessions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  const sessions = (rows as any[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    status: r.status,
    segments: JSON.parse(r.segments_json || "[]"),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const userId = (session.user as any).id;
  const id = nanoid();

  const initialSegments = JSON.stringify(
    [
      "conversational", "commercial", "dramatic", "character",
      "whisper-to-projection", "emotional-range", "technical",
      "narration", "promo", "e-learning", "medical", "podcast",
    ].map((type) => ({
      type,
      status: "pending",
      audioBase64: null,
      qualityScore: null,
    }))
  );

  await sql`
    INSERT INTO voice_print_sessions (id, user_id, status, segments_json)
    VALUES (${id}, ${userId}, ${"in-progress"}, ${initialSegments})
  `;

  const rows = await sql`SELECT * FROM voice_print_sessions WHERE id = ${id}`;
  const r = rows[0] as any;

  return NextResponse.json(
    {
      id: r.id,
      userId: r.user_id,
      status: r.status,
      segments: JSON.parse(r.segments_json || "[]"),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { sessionId, segments, status } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  // Verify ownership
  const existing = await sql`
    SELECT * FROM voice_print_sessions WHERE id = ${sessionId} AND user_id = ${userId}
  `;
  if (!existing[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const segmentsJson = segments ? JSON.stringify(segments) : (existing[0] as any).segments_json;
  const newStatus = status || (existing[0] as any).status;

  await sql`
    UPDATE voice_print_sessions
    SET segments_json = ${segmentsJson}, status = ${newStatus}, updated_at = NOW()
    WHERE id = ${sessionId} AND user_id = ${userId}
  `;

  return NextResponse.json({ success: true });
}
