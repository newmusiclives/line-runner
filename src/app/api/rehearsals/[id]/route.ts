import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getSession, updateSession } from "@/lib/db/rehearsals";
import { z } from "zod";

const updateSessionSchema = z.object({
  linesCompleted: z.number().int().min(0).optional(),
  furthestLine: z.number().int().min(0).optional(),
  durationSecs: z.number().int().min(0).optional(),
  loopCount: z.number().int().min(0).optional(),
  ended: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const rehearsal = getSession(id);
  if (!rehearsal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (rehearsal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(rehearsal);
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
  const rehearsal = getSession(id);
  if (!rehearsal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (rehearsal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { linesCompleted, furthestLine, durationSecs, loopCount, ended } = parsed.data;

  updateSession(id, {
    lines_completed: linesCompleted,
    furthest_line: furthestLine,
    duration_secs: durationSecs,
    loop_count: loopCount,
    ended_at: ended ? new Date().toISOString() : undefined,
  });

  return NextResponse.json({ success: true });
}
