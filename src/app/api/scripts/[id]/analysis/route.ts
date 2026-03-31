import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { analyzeScript } from "@/lib/ai/script-analyzer";
import { nanoid } from "nanoid";
import type { ParsedScript } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Generate analysis
  const scriptRows = await sql`SELECT parsed_data FROM scripts WHERE id = ${id}`;
  if (scriptRows.length === 0) return NextResponse.json({ error: "Script not found" }, { status: 404 });

  const parsed: ParsedScript = JSON.parse(scriptRows[0].parsed_data as string);
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
