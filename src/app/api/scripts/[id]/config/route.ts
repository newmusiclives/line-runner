import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  getScriptById,
  getVoiceAssignments,
  saveVoiceAssignments,
  getLastCharacter,
  setLastCharacter,
} from "@/lib/db/scripts";

async function requireOwner(scriptId: string, userId: string) {
  const script = await getScriptById(scriptId);
  if (!script) return { ok: false as const, status: 404, error: "Not found" };
  if (script.user_id !== userId) return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const, script };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const owner = await requireOwner(id, session.user.id);
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status });

  const [assignments, lastCharacter] = await Promise.all([
    getVoiceAssignments(id),
    getLastCharacter(id),
  ]);

  return NextResponse.json({
    lastCharacter,
    voiceAssignments: assignments.map((a) => ({
      characterName: a.character_name,
      voiceConfig: JSON.parse(a.voice_config),
    })),
  });
}

const putSchema = z.object({
  lastCharacter: z.string().min(1).optional(),
  voiceAssignments: z
    .array(
      z.object({
        characterName: z.string().min(1),
        voiceConfig: z.unknown(),
      })
    )
    .optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const owner = await requireOwner(id, session.user.id);
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status });

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.lastCharacter) {
    await setLastCharacter(id, parsed.data.lastCharacter);
  }
  if (parsed.data.voiceAssignments) {
    await saveVoiceAssignments(
      id,
      parsed.data.voiceAssignments.map((a) => ({
        characterName: a.characterName,
        voiceConfig: JSON.stringify(a.voiceConfig),
      }))
    );
  }

  return NextResponse.json({ success: true });
}
