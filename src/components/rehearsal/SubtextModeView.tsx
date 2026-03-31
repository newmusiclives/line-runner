"use client";

import { useState, useEffect, useRef } from "react";
import type { ScriptLine, SubtextConfig } from "@/types";

interface SubtextModeViewProps {
  lines: ScriptLine[];
  myCharacter: string;
  currentLineIndex: number;
  waitingForUser: boolean;
  subtextConfigs: SubtextConfig[];
}

/**
 * AI-generated subtext beneath each line.
 * Shows the unspoken intention / emotional undercurrent.
 */

function generateSubtext(line: ScriptLine, config: SubtextConfig | undefined): string {
  if (!config) return "";
  const tag = config.subtextTag.toLowerCase();
  const words = line.text.split(/\s+/);
  const shortLine = words.length < 8;

  // Generate contextual subtext based on the tag and line content
  const subtextMap: Record<string, string[]> = {
    jealous: [
      "Why them and not me?",
      "I see right through this charade.",
      "Every word is a reminder of what I cannot have.",
      "Smile. Hide the knife.",
    ],
    terrified: [
      "Do not let them see you shake.",
      "The walls are closing in.",
      "Every sound could be the end.",
      "Keep breathing. Just keep breathing.",
    ],
    "pretending to be calm": [
      "If I slow down, they will not see the panic.",
      "Measured words. Controlled breath. Steady hands.",
      "The mask must not slip. Not now.",
      "Everything is fine. Everything is absolutely fine.",
    ],
    "barely containing rage": [
      "One more word and I will explode.",
      "My fists are clenched under the table.",
      "Breathe. Do not give them the satisfaction.",
      "The fury is a living thing in my chest.",
    ],
    "deeply in love": [
      "Every word is a love letter I cannot send.",
      "Please see me. Really see me.",
      "My heart aches with how much I feel.",
      "The world disappears when you speak.",
    ],
    "hiding guilt": [
      "Do they know? Can they tell?",
      "Every word could be the one that gives me away.",
      "The weight of what I have done presses down.",
      "Look them in the eye. Lie better.",
    ],
    desperate: [
      "This is my last chance.",
      "Please. I am begging without words.",
      "There is nothing left to lose.",
      "I will say anything to make this work.",
    ],
    amused: [
      "Oh, this is delicious.",
      "They have no idea how funny this is.",
      "Trying so hard not to laugh.",
      "The irony is almost too perfect.",
    ],
    contemptuous: [
      "You are beneath me.",
      "How quaint. How utterly pathetic.",
      "I would pity you if I cared enough.",
      "Every syllable drips with disdain.",
    ],
    grieving: [
      "The absence is a hole in the world.",
      "These words taste like ashes.",
      "Going through the motions. Hollow inside.",
      "The grief is an ocean I am drowning in.",
    ],
    suspicious: [
      "Something does not add up.",
      "Watch their eyes. The truth is there.",
      "Every detail matters. Miss nothing.",
      "They are hiding something. I can feel it.",
    ],
    euphoric: [
      "I could fly. I could absolutely fly.",
      "The world is golden and perfect.",
      "Nothing can touch me. Nothing.",
      "Pure, blinding, uncontainable joy.",
    ],
    resigned: [
      "It does not matter anymore.",
      "I have fought this fight before. I know how it ends.",
      "Let it happen. I am done resisting.",
      "The weight of acceptance settles like dust.",
    ],
    manipulative: [
      "Dance, puppet. Dance.",
      "They think this was their idea.",
      "Every word is a chess move.",
      "Pull the string gently. They must not feel it.",
    ],
    protective: [
      "No one touches them. Not while I breathe.",
      "I will be the shield they never asked for.",
      "They are too precious for this cruel world.",
      "Stay behind me. I have got this.",
    ],
    vulnerable: [
      "The armor is off. I am exposed.",
      "Please be gentle with what I am showing you.",
      "This is the real me. Fragile and afraid.",
      "One wrong word could shatter me.",
    ],
  };

  const options = subtextMap[tag] || [
    "There is more beneath the surface.",
    "The real meaning hides between the words.",
    "Listen to what is not being said.",
    "The subtext runs deeper than the text.",
  ];

  // Use line length as a simple hash to pick a consistent subtext
  const idx = (words.length + (line.character?.length || 0)) % options.length;
  return options[idx];
}

export default function SubtextModeView({
  lines,
  myCharacter,
  currentLineIndex,
  waitingForUser,
  subtextConfigs,
}: SubtextModeViewProps) {
  const currentLineRef = useRef<HTMLDivElement>(null);
  const dialogueLines = lines.filter((l) => l.type === "dialogue");

  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex]);

  return (
    <div className="space-y-2">
      {/* Info banner */}
      {subtextConfigs.length === 0 && (
        <div className="bg-pink-900/20 border border-pink-800/30 rounded-xl p-4 mb-4">
          <p className="text-sm text-pink-300 text-center">
            Configure subtext for each character using the Subtext button in the toolbar above. Default subtexts will be shown.
          </p>
        </div>
      )}

      {dialogueLines.map((line, index) => {
        const isCurrentLine = index === currentLineIndex;
        const isMyLine = line.character === myCharacter;
        const isDone = index < currentLineIndex;
        const config = line.character ? subtextConfigs.find((s) => s.characterName === line.character) : undefined;
        const subtext = generateSubtext(line, config || (line.character ? { characterName: line.character, subtextTag: "vulnerable" } : undefined));

        return (
          <div
            key={line.id}
            ref={isCurrentLine ? currentLineRef : undefined}
            className={`rounded-xl p-4 transition-all ${
              isCurrentLine
                ? isMyLine
                  ? "bg-success/10 border border-success/30"
                  : "bg-accent/10 border border-accent/30"
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
                <p className={`text-base leading-relaxed ${isDone ? "text-muted" : "text-foreground"}`}>
                  {line.text}
                </p>
                {/* Subtext line */}
                <div className="mt-2 flex items-start gap-2">
                  <svg className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <p className="text-sm text-pink-400/80 italic leading-snug">
                    {config && <span className="text-pink-500 font-medium not-italic">[{config.subtextTag}] </span>}
                    {subtext}
                  </p>
                </div>
              </div>
            </div>

            {isCurrentLine && isMyLine && waitingForUser && (
              <div className="mt-3 ml-9 flex items-center gap-2 text-sm text-success">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Your line - speak now
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
