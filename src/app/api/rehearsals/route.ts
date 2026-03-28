import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listUserSessions, startSession } from "@/lib/db/rehearsals";
import { z } from "zod";

const startSessionSchema = z.object({
  scriptId: z.string().min(1),
  myCharacter: z.string().min(1),
  linesTotal: z.number().int().min(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = listUserSessions(session.user.id);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = startSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { scriptId, myCharacter, linesTotal } = parsed.data;
  const rehearsal = startSession(session.user.id, scriptId, myCharacter, linesTotal);

  return NextResponse.json(rehearsal, { status: 201 });
}
