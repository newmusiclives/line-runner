"use client";

import type { SoundEffectCue } from "@/types";

export function SoundEffectIndicator({ cue }: { cue: SoundEffectCue }) {
  const playSfx = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = new Audio(cue.sfxFile);
    audio.volume = cue.volume;
    audio.play().catch(() => {});
  };

  return (
    <button
      onClick={playSfx}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs hover:bg-warning/20 transition-colors"
      title={`Play: ${cue.sfxName}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
      {cue.sfxName}
    </button>
  );
}

export function playSoundEffect(cue: SoundEffectCue): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(cue.sfxFile);
    audio.volume = cue.volume;
    audio.addEventListener("ended", () => resolve());
    audio.addEventListener("error", () => resolve());
    audio.play().catch(() => resolve());
  });
}
