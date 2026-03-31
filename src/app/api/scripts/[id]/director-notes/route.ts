import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getScriptById } from "@/lib/db/scripts";
import { detectAllEmotions } from "@/lib/ai/emotion-detector";
import { generateDirectorNotes } from "@/lib/ai/director-notes";
import type { ParsedScript } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const character = searchParams.get("character");
  if (!character) {
    return NextResponse.json({ error: "Missing character query param" }, { status: 400 });
  }

  const script = await getScriptById(id);
  if (!script) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (script.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed: ParsedScript = JSON.parse(script.parsed_data);
  const emotions = detectAllEmotions(parsed.lines);
  const notes = generateDirectorNotes(parsed.lines, emotions, character);

  return NextResponse.json(notes);
}
