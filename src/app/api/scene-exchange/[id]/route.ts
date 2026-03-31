import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getSceneExchangeSessionById,
  joinSceneExchangeSession,
  leaveSceneExchangeSession,
} from "@/lib/db/scene-exchange";
import { joinSceneExchangeSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const room = await getSceneExchangeSessionById(id);
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(room);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = joinSceneExchangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const room = await getSceneExchangeSessionById(id);
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.action === "join") {
    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Room is not available" }, { status: 400 });
    }
    if (room.host_user_id === session.user.id) {
      return NextResponse.json({ error: "Cannot join your own room" }, { status: 400 });
    }
    const updated = await joinSceneExchangeSession(id, session.user.id);
    return NextResponse.json(updated);
  }

  if (parsed.data.action === "leave") {
    if (room.host_user_id !== session.user.id && room.guest_user_id !== session.user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }
    const updated = await leaveSceneExchangeSession(id, session.user.id);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
