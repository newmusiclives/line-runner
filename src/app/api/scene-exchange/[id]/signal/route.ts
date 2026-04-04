import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  ensureSignalingTable,
  postSignal,
  getSignals,
} from "@/lib/webrtc-signaling";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: roomId } = await params;
  await ensureSignalingTable();

  const { type, payload, toUser } = await request.json();
  if (!type || !payload) {
    return NextResponse.json(
      { error: "type and payload required" },
      { status: 400 }
    );
  }

  await postSignal(
    roomId,
    session.user.id,
    toUser || null,
    type,
    typeof payload === "string" ? payload : JSON.stringify(payload)
  );
  return NextResponse.json({ success: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: roomId } = await params;
  await ensureSignalingTable();

  const signals = await getSignals(roomId, session.user.id);
  return NextResponse.json({ signals });
}
