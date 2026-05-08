import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { getScriptById } from "@/lib/db/scripts";
import { checkFeatureAccess } from "@/lib/subscription-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzeScript } from "@/lib/ai/script-analyzer";
import { nanoid } from "nanoid";
import type { ParsedScript } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 20 analyses/hour per user. Cached results don't count against the limit (we'd
  // skip the AI call regardless), but the cap prevents bots from spamming the
  // first-analysis path that does run analyzeScript.
  const rl = checkRateLimit(`analysis:${session.user.id}`, 20, 3_600_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many analysis requests. Try again later.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.resetIn / 1000).toString() } }
    );
  }

  const access = await checkFeatureAccess(session.user.id, "script_analysis");
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Feature not available" }, { status: 403 });
  }

  const script = await getScriptById(id);
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (script.user_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sql = getDb();

  // Check if analysis already exists
  const existingRows = await sql`SELECT * FROM script_analysis WHERE script_id = ${id}`;
  const existing = existingRows[0] as {
    genre: string; tone: string; character_arcs: string; key_beats: string;
    turning_points: string; suggested_voices: string; memorisation_difficulty: string;
    estimated_sessions: number;
  } | undefined;

  if (existing) {
    return NextResponse.json({
      genre: existing.genre,
      tone: existing.tone,
      characterArcs: JSON.parse(existing.character_arcs || "{}"),
      keyBeats: JSON.parse(existing.key_beats || "[]"),
      turningPoints: JSON.parse(existing.turning_points || "[]"),
      suggestedVoiceProfiles: JSON.parse(existing.suggested_voices || "{}"),
      memorisationDifficulty: existing.memorisation_difficulty,
      estimatedSessionsToMemorize: existing.estimated_sessions,
    });
  }

  // Generate analysis (script already loaded for ownership check)
  const parsed: ParsedScript = JSON.parse(script.parsed_data);
  const analysis = analyzeScript(parsed.lines, parsed.characters);

  // Cache analysis
  const analysisId = nanoid();
  await sql`INSERT INTO script_analysis (id, script_id, genre, tone, character_arcs, key_beats, turning_points, suggested_voices, memorisation_difficulty, estimated_sessions)
    VALUES (${analysisId}, ${id}, ${analysis.genre}, ${analysis.tone},
    ${JSON.stringify(analysis.characterArcs)}, ${JSON.stringify(analysis.keyBeats)},
    ${JSON.stringify(analysis.turningPoints)}, ${JSON.stringify(analysis.suggestedVoiceProfiles)},
    ${analysis.memorisationDifficulty}, ${analysis.estimatedSessionsToMemorize})`;

  // Update script genre/tone
  await sql`UPDATE scripts SET genre = ${analysis.genre}, tone = ${analysis.tone} WHERE id = ${id}`;

  return NextResponse.json(analysis);
}
