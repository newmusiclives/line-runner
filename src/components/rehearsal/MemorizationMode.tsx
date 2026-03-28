"use client";

import { useState, useCallback } from "react";
import type { ScriptLine } from "@/types";

type DifficultyLevel = 1 | 2 | 3 | 4;

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: "Full Text",
  2: "First Words",
  3: "Cue Only",
  4: "No Help",
};

const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  1: "All lines visible",
  2: "First 3 words shown",
  3: "Only the cue line visible",
  4: "Pure memory",
};

/**
 * Returns the display text for a line based on memorization difficulty.
 * - Level 1: full text
 * - Level 2: first 3 words + "..."
 * - Level 3: blank (cue line before yours stays visible)
 * - Level 4: blank (cue line also blanked)
 */
export function getMemorizationText(
  line: ScriptLine,
  lineIndex: number,
  lines: ScriptLine[],
  myCharacter: string,
  difficulty: DifficultyLevel
): { text: string; isBlanked: boolean } {
  const isMyLine = line.character === myCharacter;

  if (!isMyLine) {
    // At level 4, blank the cue line (the line immediately before a user line)
    if (difficulty === 4) {
      const nextLine = lines[lineIndex + 1];
      if (nextLine && nextLine.character === myCharacter) {
        return { text: "_ _ _ _ _ _ _", isBlanked: true };
      }
    }
    return { text: line.text, isBlanked: false };
  }

  // It's the user's line
  switch (difficulty) {
    case 1:
      return { text: line.text, isBlanked: false };
    case 2: {
      const words = line.text.split(/\s+/);
      if (words.length <= 3) return { text: line.text, isBlanked: false };
      return { text: words.slice(0, 3).join(" ") + " ...", isBlanked: true };
    }
    case 3:
    case 4:
      return { text: "_ _ _ _ _ _ _", isBlanked: true };
    default:
      return { text: line.text, isBlanked: false };
  }
}

interface MemorizationModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
}

export default function MemorizationMode({
  lines,
  myCharacter,
  currentLineIndex,
}: MemorizationModeProps) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [revealedLines, setRevealedLines] = useState<Set<number>>(new Set());

  const toggleReveal = useCallback((index: number) => {
    setRevealedLines((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Reset reveals when difficulty changes
  const handleDifficultyChange = (level: DifficultyLevel) => {
    setDifficulty(level);
    setRevealedLines(new Set());
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Difficulty Selector */}
      <div className="bg-surface border border-border rounded-xl p-3">
        <p className="text-sm text-muted mb-2 font-medium uppercase tracking-wide">
          Memorization Difficulty
        </p>
        <div className="flex gap-2">
          {([1, 2, 3, 4] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                difficulty === level
                  ? "bg-accent text-white shadow-lg shadow-accent/25"
                  : "bg-surface-light text-muted hover:text-foreground hover:bg-border"
              }`}
            >
              <span className="block text-base">{DIFFICULTY_LABELS[level]}</span>
              <span className="block text-xs opacity-70 mt-0.5">
                {DIFFICULTY_DESCRIPTIONS[level]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lines Display */}
      <div className="space-y-2">
        {lines.map((line, index) => {
          if (line.type !== "dialogue") return null;

          const isCurrentLine = index === currentLineIndex;
          const isMyLine = line.character === myCharacter;
          const isRevealed = revealedLines.has(index);
          const { text, isBlanked } = getMemorizationText(
            line,
            index,
            lines,
            myCharacter,
            difficulty
          );

          const showRevealButton = isBlanked && !isRevealed;
          const displayText = isRevealed ? line.text : text;

          return (
            <div
              key={line.id}
              className={`rounded-xl p-4 transition-all ${
                isCurrentLine
                  ? isMyLine
                    ? "bg-success/10 border border-success/30"
                    : "bg-accent/10 border border-accent/30"
                  : "hover:bg-surface-light/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`text-sm font-bold uppercase tracking-wide pt-0.5 w-24 shrink-0 ${
                    isMyLine ? "text-success" : "text-accent-light"
                  }`}
                >
                  {line.character}
                  {isMyLine && (
                    <span className="block text-xs font-normal opacity-70 normal-case">
                      (You)
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-lg leading-relaxed ${
                      isBlanked && !isRevealed
                        ? "text-muted border-b-2 border-dotted border-muted/40 pb-1 tracking-widest"
                        : isRevealed
                          ? "text-warning italic"
                          : "text-foreground"
                    }`}
                  >
                    {displayText}
                  </p>
                  {showRevealButton && (
                    <button
                      onClick={() => toggleReveal(index)}
                      className="mt-2 text-sm text-accent-light hover:text-accent bg-accent/10 hover:bg-accent/20 px-3 py-1 rounded-full transition-colors"
                    >
                      Reveal
                    </button>
                  )}
                  {isRevealed && isBlanked && (
                    <button
                      onClick={() => toggleReveal(index)}
                      className="mt-2 text-sm text-muted hover:text-foreground bg-surface-light px-3 py-1 rounded-full transition-colors"
                    >
                      Hide
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
