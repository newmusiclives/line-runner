import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getScriptById } from "@/lib/db/scripts";
import { checkFeatureAccess } from "@/lib/subscription-guard";
import { detectAllEmotions } from "@/lib/ai/emotion-detector";
import type { ParsedScript } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await checkFeatureAccess(session.user.id, "emotion_detection");
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Feature not available" }, { status: 403 });
  }

  const { id } = await params;
  const script = await getScriptById(id);
  if (!script) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (script.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed: ParsedScript = JSON.parse(script.parsed_data);
  const emotions = detectAllEmotions(parsed.lines);

  const result: Record<string, unknown> = {};
  for (const [lineId, tag] of emotions) {
    result[lineId] = tag;
  }

  return NextResponse.json(result);
}
