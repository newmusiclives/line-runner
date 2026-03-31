"use client";

import { useEffect, useRef } from "react";
import type { ScriptLine, WildcardModifier } from "@/types";

interface WildcardModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
  waitingForUser: boolean;
  modifier: WildcardModifier | null;
}

const MODIFIER_COLORS: Record<string, string> = {
  distracted: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
  urgent: "bg-red-600/20 text-red-400 border-red-600/40",
  playful: "bg-pink-600/20 text-pink-400 border-pink-600/40",
  cold: "bg-blue-600/20 text-blue-400 border-blue-600/40",
  "barely holding it together": "bg-orange-600/20 text-orange-400 border-orange-600/40",
  contemptuous: "bg-purple-600/20 text-purple-400 border-purple-600/40",
  tender: "bg-rose-600/20 text-rose-400 border-rose-600/40",
  afraid: "bg-amber-600/20 text-amber-400 border-amber-600/40",
  exhausted: "bg-gray-600/20 text-gray-400 border-gray-600/40",
  manic: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",
  seductive: "bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-600/40",
  bored: "bg-slate-600/20 text-slate-400 border-slate-600/40",
};

const MODIFIER_DIRECTIONS: Record<string, string> = {
  distracted: "Your mind is elsewhere. Thoughts keep drifting. Half-listening, half-present.",
  urgent: "Every second counts. There is no time. Push the tempo, raise the stakes.",
  playful: "Everything is a game. Tease, flirt with danger, find the humor in every word.",
  cold: "Ice in your veins. Detached. Clinical. Not a single crack in the armor.",
  "barely holding it together": "One wrong word and you break. Hold the dam. Trembling control.",
  contemptuous: "They disgust you. Every word drips with disdain. You are above this.",
  tender: "Handle every word like glass. Gentle. Aching softness. Vulnerability exposed.",
  afraid: "The danger is real. Your body knows it before your mind. Fight or flight.",
  exhausted: "You have nothing left. Each word costs energy you do not have. Heavy.",
  manic: "Electric. Too fast, too bright, too much. The engine is redlining.",
  seductive: "Draw them in. Every pause is an invitation. Magnetism in the subtext.",
  bored: "You have heard it all before. Nothing surprises you. Flat affect, minimal effort.",
};

/**
 * Wildcard Mode - Random emotional/delivery modifiers injected per line.
 * A modifier is selected at the start of each run and applied to all deliveries.
 */
export default function WildcardMode({
  lines,
  myCharacter,
  currentLineIndex,
  waitingForUser,
  modifier,
}: WildcardModeProps) {
  const currentLineRef = useRef<HTMLDivElement>(null);
  const dialogueLines = lines.filter((l) => l.type === "dialogue");

  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex]);

  const modifierStyle = modifier ? (MODIFIER_COLORS[modifier] || "bg-accent/20 text-accent-light border-accent/40") : "";
  const direction = modifier ? (MODIFIER_DIRECTIONS[modifier] || "") : "";

  return (
    <div className="space-y-2">
      {/* Modifier Banner */}
      {modifier && (
        <div className={`rounded-xl p-4 mb-4 border ${modifierStyle}`}>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <div>
              <p className="font-bold text-lg capitalize">{modifier}</p>
              {direction && <p className="text-sm opacity-80 mt-1">{direction}</p>}
            </div>
          </div>
        </div>
      )}

      {dialogueLines.map((line, index) => {
        const isCurrentLine = index === currentLineIndex;
        const isMyLine = line.character === myCharacter;
        const isDone = index < currentLineIndex;

        return (
          <div
            key={line.id}
            ref={isCurrentLine ? currentLineRef : undefined}
            className={`rounded-xl p-4 transition-all ${
              isCurrentLine
                ? isMyLine
                  ? "line-my-turn"
                  : "line-active"
                : isDone
                  ? "line-done"
                  : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`text-sm font-bold uppercase tracking-wide pt-0.5 w-24 shrink-0 ${isMyLine ? "text-success" : "text-accent-light"}`}>
                {line.character}
                {isMyLine && <span className="block text-xs font-normal opacity-70 normal-case">(You)</span>}
              </div>
              <div className="flex-1">
                <p className={`text-base leading-relaxed ${isDone ? "text-muted" : "text-foreground"}`}>
                  {line.text}
                </p>
                {/* Per-line modifier reminder for user's lines */}
                {isCurrentLine && isMyLine && modifier && (
                  <p className={`text-xs mt-2 px-3 py-1 rounded-full inline-block border ${modifierStyle}`}>
                    Play it: {modifier}
                  </p>
                )}
              </div>
            </div>

            {isCurrentLine && isMyLine && waitingForUser && (
              <div className="mt-3 ml-9 flex items-center gap-2 text-sm text-success">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Your line - deliver with <span className="font-bold capitalize">{modifier || "your choice"}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
