"use client";

import { useState, useEffect } from "react";
import type { ScriptLine } from "@/types";

interface CueOnlyModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
}

function getLastNWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text;
  return "..." + words.slice(-n).join(" ");
}

/**
 * Cue Only Mode - Only show the last 3 words of the previous character's line as a cue.
 * Your lines are blank until you choose to reveal them.
 */
export default function CueOnlyMode({
  lines,
  myCharacter,
  currentLineIndex,
}: CueOnlyModeProps) {
  const [showLine, setShowLine] = useState(false);

  // Reset reveal when line changes
  useEffect(() => {
    setShowLine(false);
  }, [currentLineIndex]);

  const dialogueLines = lines.filter((l) => l.type === "dialogue");
  const currentLine = dialogueLines[currentLineIndex];
  if (!currentLine) return null;

  const isMyTurn = currentLine.character === myCharacter;

  // Find the cue: last 3 words of the previous line
  let cueLine: ScriptLine | null = null;
  let cueText = "";
  if (currentLineIndex > 0) {
    cueLine = dialogueLines[currentLineIndex - 1];
    cueText = getLastNWords(cueLine.text, 3);
  }

  // Find the upcoming user line if it is not currently the user's turn
  let nextMyLine: ScriptLine | null = null;
  if (!isMyTurn) {
    for (let i = currentLineIndex + 1; i < dialogueLines.length; i++) {
      if (dialogueLines[i].character === myCharacter) {
        nextMyLine = dialogueLines[i];
        break;
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Cue line - only last 3 words */}
        {cueLine && (
          <div className="bg-surface border border-border rounded-2xl p-6">
            <p className="text-sm text-accent-light uppercase tracking-wide mb-3 font-medium">
              {cueLine.character} (cue)
            </p>
            <p className="text-2xl leading-relaxed text-foreground font-medium">
              {cueText}
            </p>
            <p className="text-xs text-muted mt-2">Last 3 words only</p>
          </div>
        )}

        {/* Your line area */}
        {isMyTurn ? (
          <div
            className="relative rounded-2xl p-8 border-2 border-success/40 overflow-hidden"
            style={{ animation: "cue-pulse 2s ease-in-out infinite" }}
          >
            <div className="absolute inset-0 bg-success/5" style={{ animation: "cue-glow 2s ease-in-out infinite" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-success rounded-full animate-pulse" />
                <p className="text-sm text-success uppercase tracking-wide font-bold">
                  Your line as {currentLine.character}
                </p>
              </div>

              {showLine ? (
                <p className="text-2xl leading-relaxed text-foreground">
                  {currentLine.text}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-2xl text-muted/50 tracking-widest border-b-2 border-dotted border-muted/30 pb-2">
                    _ _ _ _ _ _ _ _ _ _
                  </p>
                  <button
                    onClick={() => setShowLine(true)}
                    className="bg-surface-light hover:bg-border text-foreground font-medium px-6 py-3 rounded-xl transition-colors text-base"
                  >
                    Show Line
                  </button>
                </div>
              )}

              {showLine && (
                <button
                  onClick={() => setShowLine(false)}
                  className="mt-4 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Hide again
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 border border-border bg-surface-light/30">
            <p className="text-sm text-muted uppercase tracking-wide mb-3 font-medium">
              {currentLine.character} is speaking
            </p>
            <p className="text-xl leading-relaxed text-foreground/70">
              {getLastNWords(currentLine.text, 3)}
            </p>
            <p className="text-xs text-muted mt-2">Cue-only: minimal text shown</p>
          </div>
        )}

        {/* Upcoming hint */}
        {nextMyLine && !isMyTurn && (
          <div className="text-center text-muted text-base">
            Your line as {nextMyLine.character} is coming up...
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes cue-pulse {
          0%, 100% { border-color: rgba(0, 184, 148, 0.4); }
          50% { border-color: rgba(0, 184, 148, 0.7); }
        }
        @keyframes cue-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
