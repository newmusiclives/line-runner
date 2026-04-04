import { auth } from "@/lib/auth/config";
import { askClaudeJson, isClaudeAvailable } from "@/lib/ai/claude-client";
import type { ScriptLine, PerformanceNote, LineMetric } from "@/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lines, metrics, myCharacter, sessionId } =
    (await request.json()) as {
      lines: ScriptLine[];
      metrics: LineMetric[];
      myCharacter: string;
      sessionId: string;
    };

  if (!lines || !metrics || !myCharacter) {
    return Response.json(
      { error: "lines, metrics, and myCharacter required" },
      { status: 400 }
    );
  }

  if (await isClaudeAvailable()) {
    const dialogueLines = lines.filter((l) => l.type === "dialogue");
    const myMetrics = metrics.filter(
      (m) => m.characterName === myCharacter
    );

    const performanceData = myMetrics.slice(0, 30).map((m) => {
      const line = dialogueLines.find((l) => l.id === m.lineId);
      const wordCount = line ? line.text.split(/\s+/).length : 0;
      return {
        lineIndex: m.lineIndex,
        text: line?.text?.slice(0, 100) || "",
        words: wordCount,
        timingMs: m.timingMs,
        skipped: m.skipped,
        replayed: m.replayed,
        expectedMs: wordCount * 350,
      };
    });

    const result = await askClaudeJson<
      Array<{
        lineIndex: number;
        note: string;
        category: string;
        severity: string;
      }>
    >(
      `You are an expert acting coach reviewing a rehearsal take for ${myCharacter}. Analyze the timing data and give specific, encouraging but honest performance notes.

Each line shows: index, text preview, word count, delivery time (ms), expected time, and whether it was skipped or replayed.

Give max 5 notes. Focus on the most impactful observations.
Categories: "pacing", "energy", "timing", "delivery"
Severity: "positive" (good work), "suggestion" (could improve), "critical" (needs attention)

Return ONLY a JSON array: [{"lineIndex": 0, "note": "...", "category": "pacing", "severity": "suggestion"}, ...]`,
      JSON.stringify(performanceData, null, 2),
      { maxTokens: 1500, temperature: 0.7 }
    );

    if (result && Array.isArray(result)) {
      const notes: PerformanceNote[] = result.map((n, i) => ({
        id: `pn-ai-${i}`,
        sessionId,
        lineId:
          myMetrics[n.lineIndex]?.lineId ||
          myMetrics[0]?.lineId ||
          "",
        lineIndex: n.lineIndex,
        timestamp: myMetrics[n.lineIndex]?.timingMs || 0,
        note: n.note,
        category: n.category as PerformanceNote["category"],
        severity: n.severity as PerformanceNote["severity"],
      }));

      return Response.json({ notes, source: "claude" });
    }
  }

  // Return empty -- the client-side heuristic coach is still the primary fallback
  return Response.json({ notes: [], source: "heuristic" });
}
