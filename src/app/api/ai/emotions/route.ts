import { auth } from "@/lib/auth/config";
import { askClaudeJson, isClaudeAvailable } from "@/lib/ai/claude-client";
import { detectAllEmotions } from "@/lib/ai/emotion-detector";
import type { ScriptLine } from "@/types";
import type { EmotionTag } from "@/lib/ai/emotion-detector";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lines } = (await request.json()) as { lines: ScriptLine[] };
  if (!lines) {
    return Response.json({ error: "lines required" }, { status: 400 });
  }

  const dialogueLines = lines.filter((l) => l.type === "dialogue");

  if (await isClaudeAvailable()) {
    // Send batches of lines for analysis
    const batch = dialogueLines.slice(0, 50);
    const linesText = batch
      .map((l, i) => `[${i}] ${l.character}: ${l.text}`)
      .join("\n");

    const result = await askClaudeJson<
      Array<{
        index: number;
        emotion: string;
        confidence: number;
        modifier: string;
      }>
    >(
      `You are an acting coach analyzing script lines for emotional content. For each line, identify the primary emotion and delivery modifier. Return a JSON array.

Valid emotions: anger, joy, sorrow, fear, love, disgust, surprise, neutral
Valid modifiers: whisper, shout, sarcasm, none
Confidence: 0.0 to 1.0

Return ONLY a JSON array like: [{"index": 0, "emotion": "anger", "confidence": 0.85, "modifier": "shout"}, ...]`,
      linesText,
      { maxTokens: 2000, temperature: 0.3 }
    );

    if (result && Array.isArray(result)) {
      const emotions: Record<string, EmotionTag> = {};

      for (const item of result) {
        const line = batch[item.index];
        if (line) {
          emotions[line.id] = {
            emotion: item.emotion as EmotionTag["emotion"],
            confidence: Math.min(1, Math.max(0, item.confidence)),
            modifier: item.modifier as EmotionTag["modifier"],
          };
        }
      }

      // Fill in any that Claude missed using heuristic
      for (const line of dialogueLines) {
        if (!emotions[line.id]) {
          const heuristic = detectAllEmotions([line]);
          const tag = heuristic.get(line.id);
          if (tag) emotions[line.id] = tag;
        }
      }

      return Response.json({ emotions, source: "claude" });
    }
  }

  // Fallback to heuristic
  const heuristicMap = detectAllEmotions(lines);
  const emotions: Record<string, EmotionTag> = {};
  heuristicMap.forEach((v, k) => {
    emotions[k] = v;
  });

  return Response.json({ emotions, source: "heuristic" });
}
