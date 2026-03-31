import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getScriptById, deleteScript } from "@/lib/db/scripts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const script = await getScriptById(id);
  if (!script) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (script.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ...script,
    parsed_data: JSON.parse(script.parsed_data),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const script = await getScriptById(id);
  if (!script) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (script.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteScript(id);
  return NextResponse.json({ success: true });
}
