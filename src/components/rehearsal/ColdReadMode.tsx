"use client";

import { useEffect, useRef } from "react";
import type { ScriptLine } from "@/types";

interface ColdReadModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
  waitingForUser: boolean;
}

/**
 * Cold Read Mode - Script revealed one line at a time.
 * You only see the current line and lines already passed.
 * Upcoming lines are hidden - genuine discovery on every exchange.
 */
export default function ColdReadMode({
  lines,
  myCharacter,
  currentLineIndex,
  waitingForUser,
}: ColdReadModeProps) {
  const currentLineRef = useRef<HTMLDivElement>(null);
  const dialogueLines = lines.filter((l) => l.type === "dialogue");

  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex]);

  return (
    <div className="space-y-2">
      {/* Instructions banner */}
      {currentLineIndex === 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-accent-light text-center">
            Cold Read: Lines are revealed one at a time. No peeking ahead.
          </p>
        </div>
      )}

      {dialogueLines.map((line, index) => {
        const isCurrentLine = index === currentLineIndex;
        const isMyLine = line.character === myCharacter;
        const isDone = index < currentLineIndex;

        // Cold Read: hide all future lines
        if (index > currentLineIndex) {
          return (
            <div
              key={line.id}
              className="rounded-xl p-4 bg-surface-light/20 border border-border/30"
            >
              <div className="flex items-start gap-3">
                <div className="text-sm font-bold uppercase tracking-wide pt-0.5 w-24 shrink-0 text-muted/30">
                  ???
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-border/20 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-border/20 rounded w-1/2" />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={line.id}
            ref={isCurrentLine ? currentLineRef : undefined}
            className={`rounded-xl p-4 transition-all ${
              isCurrentLine
                ? isMyLine
                  ? "bg-success/15 border-2 border-success/40 shadow-lg shadow-success/10"
                  : "bg-accent/10 border-2 border-accent/30 shadow-lg shadow-accent/10"
                : isDone
                  ? "opacity-50"
                  : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`text-sm font-bold uppercase tracking-wide pt-0.5 w-24 shrink-0 ${isMyLine ? "text-success" : "text-accent-light"}`}>
                {line.character}
                {isMyLine && <span className="block text-xs font-normal opacity-70 normal-case">(You)</span>}
              </div>
              <div className="flex-1">
                {isCurrentLine && !isDone ? (
                  <p className={`text-lg leading-relaxed text-foreground ${isCurrentLine ? "animate-fadeIn" : ""}`}>
                    {line.text}
                  </p>
                ) : (
                  <p className="text-base leading-relaxed text-muted">
                    {line.text}
                  </p>
                )}
              </div>
            </div>

            {isCurrentLine && isMyLine && waitingForUser && (
              <div className="mt-3 ml-9 flex items-center gap-2 text-sm text-success">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Your line - speak now
              </div>
            )}

            {/* "Just revealed" indicator on current line */}
            {isCurrentLine && (
              <div className="mt-2 ml-9">
                <span className="text-xs text-accent-light/60 uppercase tracking-wide">Just revealed</span>
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
