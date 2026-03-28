"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ScriptLine } from "@/types";

interface MobileBackstageProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
  onAdvance: () => void;
}

export default function MobileBackstage({
  lines,
  myCharacter,
  currentLineIndex,
  onAdvance,
}: MobileBackstageProps) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [goBackTriggered, setGoBackTriggered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dialogueLines = lines.filter((l) => l.type === "dialogue");
  const currentLine = dialogueLines[currentLineIndex];

  const isMyTurn = currentLine?.character === myCharacter;

  // Find user's next upcoming line
  let nextMyLine: ScriptLine | null = null;
  let linesUntilMyTurn = 0;
  if (!isMyTurn) {
    for (let i = currentLineIndex + 1; i < dialogueLines.length; i++) {
      if (dialogueLines[i].character === myCharacter) {
        nextMyLine = dialogueLines[i];
        linesUntilMyTurn = i - currentLineIndex;
        break;
      }
    }
  }

  // Handle tap to advance
  const handleTap = useCallback(() => {
    if (!goBackTriggered) {
      onAdvance();
    }
    setGoBackTriggered(false);
  }, [onAdvance, goBackTriggered]);

  // Swipe down to go back (handled via parent — we just detect)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY;
    if (delta > 80) {
      // Swipe down detected — go back
      setGoBackTriggered(true);
      // Dispatch a custom event that the parent can listen for
      window.dispatchEvent(new CustomEvent("backstage-goback"));
    }
    setTouchStartY(null);
  };

  // Prevent default scrolling in backstage mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => {
      // Allow the swipe gesture but prevent scroll
      e.preventDefault();
    };
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  if (!currentLine) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-2xl text-muted">End of script</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col min-h-screen bg-background select-none cursor-pointer"
    >
      {/* Your Turn Banner */}
      {isMyTurn && (
        <div className="bg-success text-white text-center py-3 font-bold text-lg uppercase tracking-wide shrink-0">
          Your turn
        </div>
      )}

      {/* Main Content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Speaker Name */}
        <p
          className={`text-sm font-bold uppercase tracking-widest mb-4 ${
            isMyTurn ? "text-success" : "text-accent-light"
          }`}
        >
          {currentLine.character}
          {isMyTurn && " (You)"}
        </p>

        {/* Current Line Text — LARGE */}
        <p
          className={`text-3xl leading-snug text-center font-medium max-w-lg ${
            isMyTurn ? "text-foreground" : "text-foreground/80"
          }`}
        >
          {currentLine.text}
        </p>
      </div>

      {/* Next Line Preview (if your line is coming up) */}
      {nextMyLine && !isMyTurn && (
        <div className="bg-surface border-t border-border px-6 py-4 shrink-0">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">
            Your line in {linesUntilMyTurn}{" "}
            {linesUntilMyTurn === 1 ? "line" : "lines"}
          </p>
          <p className="text-base text-foreground/60 line-clamp-2">
            {nextMyLine.text}
          </p>
        </div>
      )}

      {/* Progress indicator */}
      <div className="px-6 py-3 shrink-0">
        <div className="h-1 bg-surface-light rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 rounded-full"
            style={{
              width: `${dialogueLines.length > 0 ? ((currentLineIndex + 1) / dialogueLines.length) * 100 : 0}%`,
            }}
          />
        </div>
        <p className="text-xs text-muted text-center mt-2">
          {currentLineIndex + 1} / {dialogueLines.length} &middot; Tap to
          advance &middot; Swipe down to go back
        </p>
      </div>
    </div>
  );
}
