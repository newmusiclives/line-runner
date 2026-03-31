import type { ScriptLine, PerformanceNote, LineMetric } from "@/types";
import type { EmotionTag } from "./emotion-detector";

/**
 * Feature 01: AI Performance Coach
 * Analyses timing data, volume dynamics, and emotional arc to generate
 * specific, actionable notes after each take.
 */
export function generatePerformanceNotes(
  lines: ScriptLine[],
  metrics: LineMetric[],
  emotions: Map<string, EmotionTag>,
  myCharacter: string,
  sessionId: string
): PerformanceNote[] {
  const notes: PerformanceNote[] = [];
  const dialogueLines = lines.filter((l) => l.type === "dialogue");
  const myLines = dialogueLines.filter((l) => l.character === myCharacter);
  const myMetrics = metrics.filter((m) => m.characterName === myCharacter);

  if (myMetrics.length === 0) return notes;

  // Average timing for user's lines
  const avgTiming = myMetrics.reduce((sum, m) => sum + m.timingMs, 0) / myMetrics.length;
  let noteId = 0;

  for (const metric of myMetrics) {
    const line = dialogueLines.find((l) => l.id === metric.lineId);
    if (!line) continue;

    const emotion = emotions.get(metric.lineId);
    const wordCount = line.text.split(/\s+/).length;
    const expectedMs = wordCount * 350; // ~170 WPM baseline
    const ratio = metric.timingMs / expectedMs;

    // Rushed delivery
    if (ratio < 0.6 && wordCount > 8) {
      notes.push({
        id: `pn-${noteId++}`,
        sessionId,
        lineId: metric.lineId,
        lineIndex: metric.lineIndex,
        timestamp: metric.timingMs,
        note: `You rushed through this line — ${wordCount} words in ${(metric.timingMs / 1000).toFixed(1)}s. Slow down and let each phrase land. The audience needs time to absorb what ${myCharacter} is saying.`,
        category: "pacing",
        severity: "suggestion",
      });
    }

    // Long pause / hesitation
    if (ratio > 2.5 && wordCount > 5) {
      notes.push({
        id: `pn-${noteId++}`,
        sessionId,
        lineId: metric.lineId,
        lineIndex: metric.lineIndex,
        timestamp: metric.timingMs,
        note: `Your energy dropped here — long pause before delivery. If the hesitation was intentional, it works. If not, this line needs more confidence in your preparation.`,
        category: "energy",
        severity: "suggestion",
      });
    }

    // Skipped line
    if (metric.skipped) {
      notes.push({
        id: `pn-${noteId++}`,
        sessionId,
        lineId: metric.lineId,
        lineIndex: metric.lineIndex,
        timestamp: 0,
        note: `You skipped this line. If you're struggling with it, try the Line Memory Tracker to drill your sticking points.`,
        category: "delivery",
        severity: "critical",
      });
    }

    // Emotional peak line delivered too fast
    if (emotion && (emotion.emotion === "anger" || emotion.emotion === "love" || emotion.emotion === "sorrow") && emotion.confidence > 0.7 && ratio < 0.8) {
      notes.push({
        id: `pn-${noteId++}`,
        sessionId,
        lineId: metric.lineId,
        lineIndex: metric.lineIndex,
        timestamp: metric.timingMs,
        note: `This is an emotionally charged moment (${emotion.emotion}) — but you delivered it quickly. Give this line room to breathe. The feeling needs space.`,
        category: "timing",
        severity: "suggestion",
      });
    }
  }

  // Check for replayed lines - good sign
  const replayedLines = myMetrics.filter((m) => m.replayed);
  if (replayedLines.length > 0 && replayedLines.length <= 3) {
    const firstReplay = replayedLines[0];
    notes.push({
      id: `pn-${noteId++}`,
      sessionId,
      lineId: firstReplay.lineId,
      lineIndex: firstReplay.lineIndex,
      timestamp: 0,
      note: `Good instinct replaying ${replayedLines.length} line${replayedLines.length > 1 ? "s" : ""}. Working a specific moment multiple times is how you find the truth of a line.`,
      category: "delivery",
      severity: "positive",
    });
  }

  // Overall pacing note
  const fastLines = myMetrics.filter((m) => {
    const line = dialogueLines.find((l) => l.id === m.lineId);
    if (!line) return false;
    return m.timingMs / (line.text.split(/\s+/).length * 350) < 0.7;
  });

  if (fastLines.length > myMetrics.length * 0.5) {
    notes.push({
      id: `pn-${noteId++}`,
      sessionId,
      lineId: myMetrics[0].lineId,
      lineIndex: 0,
      timestamp: 0,
      note: `Overall pacing note: you rushed through more than half your lines. Take a breath between cue and delivery. The pause before you speak is where the acting happens.`,
      category: "pacing",
      severity: "critical",
    });
  }

  // Consistent timing is good
  if (myMetrics.length >= 5) {
    const timings = myMetrics.map((m) => m.timingMs);
    const variance = calculateVariance(timings);
    const cv = Math.sqrt(variance) / avgTiming;

    if (cv < 0.3 && fastLines.length < myMetrics.length * 0.3) {
      notes.push({
        id: `pn-${noteId++}`,
        sessionId,
        lineId: myMetrics[myMetrics.length - 1].lineId,
        lineIndex: myMetrics[myMetrics.length - 1].lineIndex,
        timestamp: 0,
        note: `Strong consistency in your pacing across the scene. Your timing feels natural and grounded. Keep this rhythm as you deepen the emotional work.`,
        category: "pacing",
        severity: "positive",
      });
    }
  }

  return notes.slice(0, 5); // Max 5 notes per take
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Feature 05: Line Memory Tracker
 * Builds a heatmap of which lines the actor keeps stumbling on.
 */
export function buildStumbleHeatmap(
  stumbleEvents: { lineId: string; lineIndex: number; count: number }[]
): Map<string, { severity: "clean" | "amber" | "red"; count: number }> {
  const heatmap = new Map<string, { severity: "clean" | "amber" | "red"; count: number }>();

  for (const event of stumbleEvents) {
    let severity: "clean" | "amber" | "red" = "clean";
    if (event.count >= 5) severity = "red";
    else if (event.count >= 2) severity = "amber";
    heatmap.set(event.lineId, { severity, count: event.count });
  }

  return heatmap;
}

/**
 * Get the top N problem lines for warm-up drill
 */
export function getTopProblemLines(
  stumbleEvents: { lineId: string; lineIndex: number; count: number }[],
  limit: number = 5
): { lineId: string; lineIndex: number; count: number }[] {
  return [...stumbleEvents]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
