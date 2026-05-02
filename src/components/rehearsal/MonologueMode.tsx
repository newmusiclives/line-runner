"use client";

import { useMemo, useState, useCallback } from "react";
import type { ScriptLine } from "@/types";

type HintLength = 1 | 3 | 5;

const HINT_LABELS: Record<HintLength, string> = {
  1: "1 word",
  3: "3 words",
  5: "5 words",
};

interface MonologueChunk {
  startIndex: number;
  endIndex: number;
  lineIndices: number[];
}

function firstNWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text.trim();
  return words.slice(0, n).join(" ") + " ...";
}

function detectChunks(
  dialogueLines: ScriptLine[],
  myCharacter: string,
  minSize = 2
): MonologueChunk[] {
  const chunks: MonologueChunk[] = [];
  let current: MonologueChunk | null = null;
  dialogueLines.forEach((line, idx) => {
    if (line.character === myCharacter) {
      if (current) {
        current.endIndex = idx;
        current.lineIndices.push(idx);
      } else {
        current = { startIndex: idx, endIndex: idx, lineIndices: [idx] };
      }
    } else if (current) {
      if (current.lineIndices.length >= minSize) chunks.push(current);
      current = null;
    }
  });
  if (current && (current as MonologueChunk).lineIndices.length >= minSize) {
    chunks.push(current);
  }
  return chunks;
}

interface MonologueModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
}

export default function MonologueMode({
  lines,
  myCharacter,
  currentLineIndex,
}: MonologueModeProps) {
  const [hintLength, setHintLength] = useState<HintLength>(3);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showCueContext, setShowCueContext] = useState(true);

  const dialogueLines = useMemo(
    () => lines.filter((l) => l.type === "dialogue"),
    [lines]
  );

  const chunks = useMemo(
    () => detectChunks(dialogueLines, myCharacter),
    [dialogueLines, myCharacter]
  );

  const activeChunk = useMemo(
    () =>
      chunks.find(
        (c) =>
          currentLineIndex >= c.startIndex && currentLineIndex <= c.endIndex
      ) ?? null,
    [chunks, currentLineIndex]
  );

  const toggleReveal = useCallback((idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const revealAll = useCallback(() => {
    if (!activeChunk) return;
    setRevealed(new Set(activeChunk.lineIndices));
  }, [activeChunk]);

  const hideAll = useCallback(() => {
    setRevealed(new Set());
  }, []);

  if (chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-xl text-center">
          <p className="text-lg text-foreground font-medium mb-2">
            No monologues found
          </p>
          <p className="text-sm text-muted">
            Monologue mode activates when you have two or more lines in a row
            as <span className="text-foreground font-medium">{myCharacter}</span>.
            Try Standard or Memorization mode for back-and-forth dialogue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Settings bar */}
      <div className="bg-surface border border-border rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted font-medium uppercase tracking-wide">
            Hint
          </span>
          <div className="flex gap-1">
            {([1, 3, 5] as HintLength[]).map((n) => (
              <button
                key={n}
                onClick={() => setHintLength(n)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  hintLength === n
                    ? "bg-accent text-white shadow shadow-accent/25"
                    : "bg-surface-light text-muted hover:text-foreground"
                }`}
              >
                {HINT_LABELS[n]}
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        <button
          onClick={() => setShowCueContext((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            showCueContext
              ? "bg-surface-light text-foreground"
              : "bg-surface-light text-muted"
          }`}
        >
          {showCueContext ? "Hide" : "Show"} cue context
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={revealAll}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-light text-muted hover:text-foreground"
          >
            Reveal all
          </button>
          <button
            onClick={hideAll}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-light text-muted hover:text-foreground"
          >
            Hide all
          </button>
        </div>
      </div>

      {/* Active chunk badge */}
      {activeChunk && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-accent-light font-medium">
            Monologue · {activeChunk.lineIndices.length} lines
          </p>
          <p className="text-sm text-muted">
            Line{" "}
            <span className="text-foreground font-medium">
              {activeChunk.lineIndices.indexOf(currentLineIndex) + 1 ||
                "—"}
            </span>{" "}
            of {activeChunk.lineIndices.length}
          </p>
        </div>
      )}

      {/* Lines */}
      <div className="space-y-2">
        {dialogueLines.map((line, idx) => {
          const isMyLine = line.character === myCharacter;
          const isCurrent = idx === currentLineIndex;
          const inActiveChunk =
            activeChunk &&
            idx >= activeChunk.startIndex &&
            idx <= activeChunk.endIndex;

          if (!isMyLine && !showCueContext) return null;

          if (!isMyLine) {
            return (
              <div
                key={line.id}
                className={`rounded-xl p-3 opacity-60 ${
                  isCurrent
                    ? "bg-accent/10 border border-accent/30 opacity-100"
                    : "bg-surface-light/30"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-accent-light/80 font-medium mb-1">
                  {line.character} (cue)
                </p>
                <p className="text-base text-foreground/80 leading-relaxed">
                  {line.text}
                </p>
              </div>
            );
          }

          const isRevealed = revealed.has(idx);
          const hint = firstNWords(line.text, hintLength);
          const hasMore = line.text.trim().split(/\s+/).length > hintLength;

          return (
            <div
              key={line.id}
              className={`rounded-xl p-4 transition-all ${
                isCurrent
                  ? "bg-success/10 border border-success/40"
                  : inActiveChunk
                    ? "bg-surface border border-border"
                    : "bg-surface-light/40 border border-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-sm font-bold uppercase tracking-wide pt-0.5 w-24 shrink-0 text-success">
                  {line.character}
                  <span className="block text-xs font-normal opacity-70 normal-case">
                    (You)
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {isRevealed ? (
                    <p className="text-lg leading-relaxed text-foreground">
                      {line.text}
                    </p>
                  ) : (
                    <p className="text-lg leading-relaxed text-muted border-b-2 border-dotted border-muted/40 pb-1">
                      {hint}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    {hasMore && (
                      <button
                        onClick={() => toggleReveal(idx)}
                        className={`text-sm px-3 py-1 rounded-full transition-colors ${
                          isRevealed
                            ? "bg-surface-light text-muted hover:text-foreground"
                            : "bg-accent/10 text-accent-light hover:bg-accent/20"
                        }`}
                      >
                        {isRevealed ? "Hide" : "Reveal"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
