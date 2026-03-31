import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getActorProfileById } from "@/lib/db/pass";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ actorId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { actorId } = await params;
  const actor = await getActorProfileById(actorId);
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(actor);
}
