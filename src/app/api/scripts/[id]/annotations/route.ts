import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAnnotations, createAnnotation } from "@/lib/db/scripts";
import { annotationSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const annotations = getAnnotations(id, session.user.id);
  return NextResponse.json(annotations);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = annotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lineId, noteType, content } = parsed.data;
  const annotationId = createAnnotation(session.user.id, id, lineId, noteType, content);

  return NextResponse.json({ id: annotationId }, { status: 201 });
}
