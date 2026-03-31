import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getSession, saveLineMetrics } from "@/lib/db/rehearsals";
import { lineMetricsSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const rehearsal = await getSession(id);
  if (!rehearsal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (rehearsal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = lineMetricsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await saveLineMetrics(id, parsed.data);
  return NextResponse.json({ success: true }, { status: 201 });
}
