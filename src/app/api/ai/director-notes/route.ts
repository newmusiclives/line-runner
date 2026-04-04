import { auth } from "@/lib/auth/config";
import { askClaudeJson, isClaudeAvailable } from "@/lib/ai/claude-client";
import { generateDirectorNotes } from "@/lib/ai/director-notes";
import { detectAllEmotions } from "@/lib/ai/emotion-detector";
import type { ScriptLine } from "@/types";
import type { DirectorNote } from "@/lib/ai/director-notes";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lines, myCharacter } = (await request.json()) as {
    lines: ScriptLine[];
    myCharacter: string;
  };

  if (!lines || !myCharacter) {
    return Response.json(
      { error: "lines and myCharacter required" },
      { status: 400 }
    );
  }

  if (await isClaudeAvailable()) {
    const myDialogue = lines
      .filter((l) => l.type === "dialogue")
      .map((l, i) => ({
        idx: i,
        id: l.id,
        char: l.character,
        text: l.text.slice(0, 200),
        isMine: l.character === myCharacter,
      }));

    const preview = myDialogue
      .slice(0, 40)
      .map(
        (l) =>
          `[${l.idx}] ${l.char}${l.isMine ? " (YOU)" : ""}: ${l.text}`
      )
      .join("\n");

    const result = await askClaudeJson<
      Array<{
        lineIndex: number;
        suggestion: string;
        category: string;
      }>
    >(
      `You are an experienced theatre director giving specific, actionable notes to an actor playing ${myCharacter}. For their key lines, provide brief directorial suggestions.

Focus on: pacing, emotional truth, subtext, physicality, relationship dynamics.
Only give notes for lines marked (YOU).
Return a JSON array of max 15 notes.

Categories: "pacing", "emotion", "subtext", "physicality", "general"
Format: [{"lineIndex": 0, "suggestion": "...", "category": "pacing"}, ...]

Return ONLY valid JSON.`,
      preview,
      { maxTokens: 2000, temperature: 0.7 }
    );

    if (result && Array.isArray(result)) {
      const dialogueLines = lines.filter((l) => l.type === "dialogue");
      const notes: DirectorNote[] = result
        .map((n) => ({
          lineId: dialogueLines[n.lineIndex]?.id || "",
          suggestion: n.suggestion,
          category:
            (n.category as DirectorNote["category"]) || "general",
        }))
        .filter((n) => n.lineId);

      return Response.json({ notes, source: "claude" });
    }
  }

  // Fallback to heuristic
  const emotions = detectAllEmotions(lines);
  const notes = generateDirectorNotes(lines, emotions, myCharacter);
  return Response.json({ notes, source: "heuristic" });
}
