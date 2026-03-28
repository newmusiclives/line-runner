import type { ScriptLine } from "@/types";
import type { EmotionTag, Emotion } from "./emotion-detector";

export interface DirectorNote {
  lineId: string;
  suggestion: string;
  category: "pacing" | "emotion" | "subtext" | "physicality" | "general";
}

export function generateDirectorNotes(
  lines: ScriptLine[],
  emotions: Map<string, EmotionTag>,
  myCharacter: string
): DirectorNote[] {
  const notes: DirectorNote[] = [];
  const dialogueLines = lines.filter((l) => l.type === "dialogue");

  for (let i = 0; i < dialogueLines.length; i++) {
    const line = dialogueLines[i];
    if (line.character !== myCharacter) continue;

    const words = line.text.split(/\s+/).length;
    const emotion = emotions.get(line.id);
    const prevLine = i > 0 ? dialogueLines[i - 1] : null;
    const prevEmotion = prevLine ? emotions.get(prevLine.id) : null;

    // Long speech pacing
    if (words > 50) {
      notes.push({
        lineId: line.id,
        suggestion: "This is a long speech. Break it into beats — find 2-3 natural pause points where the thought shifts. Let the audience breathe with you.",
        category: "pacing",
      });
    }

    // Emotional shift detection
    if (emotion && prevEmotion && prevLine?.character === myCharacter) {
      if (emotion.emotion !== prevEmotion.emotion && emotion.emotion !== "neutral" && prevEmotion.emotion !== "neutral") {
        notes.push({
          lineId: line.id,
          suggestion: `Notice the emotional shift from ${prevEmotion.emotion} to ${emotion.emotion}. Don't rush the transition — let the audience see the change happen on your face before you speak.`,
          category: "emotion",
        });
      }
    }

    // Response to question
    if (prevLine && prevLine.character !== myCharacter && prevLine.text.trim().endsWith("?")) {
      notes.push({
        lineId: line.id,
        suggestion: "You're answering a question. Take a beat to process what was asked before responding — the audience needs to see you think.",
        category: "pacing",
      });
    }

    // Repetition detection
    const wordCounts = new Map<string, number>();
    for (const w of line.text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)) {
      if (w.length > 3) wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }
    for (const [word, count] of wordCounts) {
      if (count >= 3) {
        notes.push({
          lineId: line.id,
          suggestion: `The word "${word}" repeats ${count} times — this is intentional by the playwright. Build intensity or shift meaning with each repetition.`,
          category: "subtext",
        });
        break;
      }
    }

    // After stage direction (physicality)
    const lineIdx = lines.indexOf(line);
    if (lineIdx > 0 && lines[lineIdx - 1].type === "stage-direction") {
      notes.push({
        lineId: line.id,
        suggestion: `This line follows a stage direction. Complete the physical action before speaking — let the movement motivate the words.`,
        category: "physicality",
      });
    }

    // First line of a scene
    if (i === 0 || (line.act !== dialogueLines[i - 1]?.act || line.scene !== dialogueLines[i - 1]?.scene)) {
      if (line.character === myCharacter) {
        notes.push({
          lineId: line.id,
          suggestion: "You open this scene. Take a moment to establish your character's state before the first word — where are you coming from? What just happened?",
          category: "general",
        });
      }
    }

    // Line ends with "..." or dash — interrupted/trailing thought
    if (line.text.trim().endsWith("...") || line.text.trim().endsWith("—")) {
      notes.push({
        lineId: line.id,
        suggestion: "This line trails off or gets interrupted. Know what the unfinished thought would have been — the audience reads it in your eyes.",
        category: "subtext",
      });
    }

    // Whisper/shout modifier notes
    if (emotion?.modifier === "whisper") {
      notes.push({
        lineId: line.id,
        suggestion: "This is whispered — but don't just lower your volume. Increase your physical intensity. Whispers are often more powerful than shouts.",
        category: "general",
      });
    }
  }

  return notes;
}
