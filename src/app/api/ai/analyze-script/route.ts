import { auth } from "@/lib/auth/config";
import { askClaudeJson, isClaudeAvailable } from "@/lib/ai/claude-client";
import { analyzeScript } from "@/lib/ai/script-analyzer";
import type { ScriptLine, Character, ScriptAnalysis } from "@/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lines, characters } = (await request.json()) as {
    lines: ScriptLine[];
    characters: Character[];
  };

  if (!lines || !characters) {
    return Response.json(
      { error: "lines and characters are required" },
      { status: 400 }
    );
  }

  // Try Claude first
  if (await isClaudeAvailable()) {
    const dialoguePreview = lines
      .filter((l) => l.type === "dialogue")
      .slice(0, 60)
      .map((l) => `${l.character}: ${l.text}`)
      .join("\n");

    const charNames = characters.map((c) => c.name).join(", ");

    const result = await askClaudeJson<{
      genre: string;
      tone: string;
      characterArcs: Record<string, string>;
      keyBeats: Array<{ lineIndex: number; description: string }>;
      memorisationDifficulty: string;
      estimatedSessionsToMemorize: number;
    }>(
      `You are a professional dramaturge and script analyst. Analyze this script excerpt and return JSON with these fields:
- genre: one of "tragedy", "comedy", "romance", "thriller", "drama", "historical"
- tone: one of "dark", "light", "tense", "intimate", "comedic", "melancholic"
- characterArcs: object mapping character name to a 2-sentence arc description
- keyBeats: array of {lineIndex: number, description: string} for the 5 most important dramatic beats
- memorisationDifficulty: "easy", "moderate", "hard", or "very-hard"
- estimatedSessionsToMemorize: integer

Return ONLY valid JSON, no markdown.`,
      `Characters: ${charNames}\n\nScript:\n${dialoguePreview}`,
      { maxTokens: 1500, temperature: 0.5 }
    );

    if (result) {
      // Map keyBeats lineIndex to lineId
      const dialogueLines = lines.filter((l) => l.type === "dialogue");
      const keyBeats = (result.keyBeats || []).map((b) => ({
        lineId:
          dialogueLines[b.lineIndex]?.id || dialogueLines[0]?.id || "",
        description: b.description,
      }));

      const analysis: ScriptAnalysis = {
        genre: result.genre || "drama",
        tone: result.tone || "tense",
        characterArcs: result.characterArcs || {},
        keyBeats,
        turningPoints: keyBeats.slice(0, 3),
        suggestedVoiceProfiles: Object.fromEntries(
          characters.map((c) => [
            c.name,
            {
              age: c.suggestedAge,
              gender: c.suggestedGender,
              accent: c.suggestedAccent,
            },
          ])
        ),
        memorisationDifficulty:
          (result.memorisationDifficulty as ScriptAnalysis["memorisationDifficulty"]) ||
          "moderate",
        estimatedSessionsToMemorize:
          result.estimatedSessionsToMemorize || 5,
      };

      return Response.json({ analysis, source: "claude" });
    }
  }

  // Fallback to heuristic
  const analysis = analyzeScript(lines, characters);
  return Response.json({ analysis, source: "heuristic" });
}
