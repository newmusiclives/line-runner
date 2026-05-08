import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAnnotations, createAnnotation } from "@/lib/db/scripts";
import { checkFeatureAccess } from "@/lib/subscription-guard";
import { annotationSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await checkFeatureAccess(session.user.id, "annotations");
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Feature not available" }, { status: 403 });
  }

  const { id } = await params;
  const annotations = await getAnnotations(id, session.user.id);
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

  const access = await checkFeatureAccess(session.user.id, "annotations");
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Feature not available" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = annotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lineId, noteType, content } = parsed.data;
  const annotationId = await createAnnotation(session.user.id, id, lineId, noteType, content);

  return NextResponse.json({ id: annotationId }, { status: 201 });
}
