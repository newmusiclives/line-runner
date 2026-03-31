"use client";

import type { ScriptLine } from "@/types";

interface BackstageModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
  isPlaying: boolean;
  waitingForUser: boolean;
  totalLines: number;
}

/**
 * Backstage Mode - Audio only, no text shown.
 * The user listens to AI voices and responds from memory.
 * Only shows: who is speaking, whether it is your turn, and progress.
 */
export default function BackstageMode({
  lines,
  myCharacter,
  currentLineIndex,
  isPlaying,
  waitingForUser,
  totalLines,
}: BackstageModeProps) {
  const dialogueLines = lines.filter((l) => l.type === "dialogue");
  const currentLine = dialogueLines[currentLineIndex];

  if (!currentLine) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-2xl text-muted">End of script</p>
      </div>
    );
  }

  const isMyTurn = currentLine.character === myCharacter;
  const progress = totalLines > 0 ? ((currentLineIndex + 1) / totalLines) * 100 : 0;

  // Count how many lines until the user's next turn
  let linesUntilMyTurn = 0;
  if (!isMyTurn) {
    for (let i = currentLineIndex + 1; i < dialogueLines.length; i++) {
      if (dialogueLines[i].character === myCharacter) {
        linesUntilMyTurn = i - currentLineIndex;
        break;
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Audio visualization placeholder */}
      <div className="mb-8">
        {isPlaying && !isMyTurn ? (
          <div className="flex items-center gap-1.5">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-accent-light rounded-full"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animation: `backstage-bar ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        ) : isMyTurn ? (
          <div className="w-24 h-24 rounded-full bg-success/20 border-4 border-success flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-surface-light border-2 border-border flex items-center justify-center">
            <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Speaker indicator - no text content */}
      <div className="text-center mb-6">
        <p className={`text-2xl font-bold uppercase tracking-wide ${isMyTurn ? "text-success" : "text-accent-light"}`}>
          {isMyTurn ? "Your Turn" : currentLine.character}
        </p>
        {isMyTurn && (
          <p className="text-success/80 text-lg mt-2 animate-pulse">Speak your line from memory</p>
        )}
        {!isMyTurn && isPlaying && (
          <p className="text-muted text-sm mt-2">Listening...</p>
        )}
      </div>

      {/* Lines until turn */}
      {!isMyTurn && linesUntilMyTurn > 0 && (
        <div className="bg-surface-light rounded-xl px-6 py-3 mb-6">
          <p className="text-sm text-muted">
            Your turn in <span className="text-accent-light font-bold">{linesUntilMyTurn}</span> {linesUntilMyTurn === 1 ? "line" : "lines"}
          </p>
        </div>
      )}

      {/* Minimal progress */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
          <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted text-center mt-2">
          {currentLineIndex + 1} / {totalLines}
        </p>
      </div>

      {/* Info card */}
      <div className="mt-8 bg-surface border border-border rounded-xl p-4 max-w-md">
        <p className="text-sm text-muted text-center">
          Audio-only mode. No script text is shown. Listen to the AI voices and deliver your lines from memory.
        </p>
      </div>

      <style jsx>{`
        @keyframes backstage-bar {
          0% { height: 8px; }
          100% { height: 48px; }
        }
      `}</style>
    </div>
  );
}
