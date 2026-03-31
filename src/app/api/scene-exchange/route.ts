import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  listWaitingSceneExchangeSessions,
  createSceneExchangeSession,
} from "@/lib/db/scene-exchange";
import { createSceneExchangeSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rooms = await listWaitingSceneExchangeSessions();
  return NextResponse.json(rooms);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSceneExchangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { scriptId, hostCharacter, guestCharacter } = parsed.data;

  const room = await createSceneExchangeSession(
    scriptId,
    session.user.id,
    hostCharacter,
    guestCharacter
  );

  return NextResponse.json(room, { status: 201 });
}
