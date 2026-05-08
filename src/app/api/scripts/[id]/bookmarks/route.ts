import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getBookmarks, createBookmark, deleteBookmark } from "@/lib/db/scripts";
import { checkFeatureAccess } from "@/lib/subscription-guard";
import { bookmarkSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await checkFeatureAccess(session.user.id, "bookmarks");
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Feature not available" }, { status: 403 });
  }

  const { id } = await params;
  const bookmarks = await getBookmarks(id, session.user.id);
  return NextResponse.json(bookmarks);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await checkFeatureAccess(session.user.id, "bookmarks");
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Feature not available" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = bookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { label, startLineIdx, endLineIdx } = parsed.data;
  const bookmarkId = await createBookmark(session.user.id, id, label, startLineIdx, endLineIdx);

  return NextResponse.json({ id: bookmarkId }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await checkFeatureAccess(session.user.id, "bookmarks");
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Feature not available" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const bookmarkId = searchParams.get("id");
  if (!bookmarkId) {
    return NextResponse.json({ error: "Missing bookmark id" }, { status: 400 });
  }

  await deleteBookmark(bookmarkId, session.user.id);
  return NextResponse.json({ success: true });
}
