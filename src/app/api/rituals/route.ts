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
    SELECT * FROM ritual_presets
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  const presets = (rows as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    breathInhale: r.breath_inhale,
    breathHold: r.breath_hold,
    breathExhale: r.breath_exhale,
    breathCycles: r.breath_cycles,
    motivationalAudioUrl: r.motivational_audio_url,
    countdownSeconds: r.countdown_secs,
  }));

  return NextResponse.json(presets);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();

  const {
    name,
    breathInhale = 4,
    breathHold = 4,
    breathExhale = 6,
    breathCycles = 3,
    countdownSeconds = 5,
  } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const id = nanoid();

  await sql`
    INSERT INTO ritual_presets (id, user_id, name, breath_inhale, breath_hold, breath_exhale, breath_cycles, countdown_secs)
    VALUES (${id}, ${userId}, ${name.trim()}, ${breathInhale}, ${breathHold}, ${breathExhale}, ${breathCycles}, ${countdownSeconds})
  `;

  return NextResponse.json(
    {
      id,
      name: name.trim(),
      breathInhale,
      breathHold,
      breathExhale,
      breathCycles,
      countdownSeconds,
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const presetId = searchParams.get("id");

  if (!presetId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await sql`
    DELETE FROM ritual_presets WHERE id = ${presetId} AND user_id = ${userId}
  `;

  return NextResponse.json({ success: true });
}
