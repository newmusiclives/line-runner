import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { analyzeScript } from "@/lib/ai/script-analyzer";
import type { ParsedScript } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Check if analysis already exists
  const existing = db.prepare("SELECT * FROM script_analysis WHERE script_id = ?").get(id) as {
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
  const script = db.prepare("SELECT parsed_data FROM scripts WHERE id = ?").get(id) as { parsed_data: string } | undefined;
  if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

  const parsed: ParsedScript = JSON.parse(script.parsed_data);
  const analysis = analyzeScript(parsed.lines, parsed.characters);

  // Cache analysis
  const { nanoid } = await import("nanoid");
  db.prepare(`
    INSERT INTO script_analysis (id, script_id, genre, tone, character_arcs, key_beats, turning_points, suggested_voices, memorisation_difficulty, estimated_sessions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nanoid(), id, analysis.genre, analysis.tone,
    JSON.stringify(analysis.characterArcs), JSON.stringify(analysis.keyBeats),
    JSON.stringify(analysis.turningPoints), JSON.stringify(analysis.suggestedVoiceProfiles),
    analysis.memorisationDifficulty, analysis.estimatedSessionsToMemorize
  );

  // Update script genre/tone
  db.prepare("UPDATE scripts SET genre = ?, tone = ? WHERE id = ?").run(analysis.genre, analysis.tone, id);

  return NextResponse.json(analysis);
}
