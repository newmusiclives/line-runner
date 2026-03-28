"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { RehearsalSession, ScriptLine } from "@/types";

export default function TeleprompterPage() {
  const router = useRouter();
  const [session, setSession] = useState<RehearsalSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fontSize, setFontSize] = useState(48);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("rehearsal-session");
    if (data) setSession(JSON.parse(data));
    else router.push("/upload");
  }, [router]);

  useEffect(() => {
    try { document.documentElement.requestFullscreen(); } catch {}
    return () => { try { document.exitFullscreen(); } catch {} };
  }, []);

  // Auto-hide controls after 3s
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      resetControlsTimer();
      if (e.key === "Escape") {
        try { document.exitFullscreen(); } catch {}
        router.back();
      }
      if (e.key === " " || e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentIdx((p) => Math.min(p + 1, dialogueLines.length - 1));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentIdx((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  if (!session) return null;

  const dialogueLines = session.script.lines.filter((l) => l.type === "dialogue");
  const myChars = session.myCharacters || [session.myCharacter];

  const prevLine = currentIdx > 0 ? dialogueLines[currentIdx - 1] : null;
  const currLine = dialogueLines[currentIdx];
  const nextLine = currentIdx < dialogueLines.length - 1 ? dialogueLines[currentIdx + 1] : null;

  const isMyLine = (l: ScriptLine | null) => l?.character && myChars.includes(l.character);
  const isMyNext = isMyLine(nextLine);
  const isMyCurrent = isMyLine(currLine);

  // Cue light: green = my turn, amber = I'm next, red = wait
  let cueColor = "bg-red-500 shadow-red-500/50"; // red default
  if (isMyCurrent) cueColor = "bg-green-500 shadow-green-500/50 animate-pulse";
  else if (isMyNext) cueColor = "bg-amber-400 shadow-amber-400/50 animate-pulse";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black text-white flex flex-col cursor-none select-none"
      style={{ transform: mirrorMode ? "scaleX(-1)" : "none" }}
      onClick={() => {
        resetControlsTimer();
        setCurrentIdx((p) => Math.min(p + 1, dialogueLines.length - 1));
      }}
      onMouseMove={resetControlsTimer}
    >
      {/* Cue Light */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <div className={`w-16 h-16 rounded-full ${cueColor} shadow-[0_0_60px]`} />
      </div>

      {/* Script Lines — 3 line display */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        {/* Previous line */}
        <div className="opacity-30 text-center max-w-4xl transition-all duration-500" style={{ fontSize: fontSize * 0.6 }}>
          {prevLine && (
            <>
              <span className="font-bold text-accent-light">{prevLine.character}: </span>
              {prevLine.text}
            </>
          )}
        </div>

        {/* Current line */}
        <div
          className={`text-center max-w-5xl font-medium transition-all duration-300 ${
            isMyCurrent ? "text-green-400" : "text-white"
          }`}
          style={{ fontSize }}
        >
          <div className="text-lg uppercase tracking-widest mb-3 opacity-60">
            {currLine?.character}
            {isMyCurrent && " (YOU)"}
          </div>
          <div className="leading-tight">{currLine?.text}</div>
          {isMyCurrent && (
            <div className="mt-4 text-lg text-green-400/70 animate-pulse">
              Your line — speak now
            </div>
          )}
        </div>

        {/* Next line */}
        <div className="opacity-20 text-center max-w-4xl transition-all duration-500" style={{ fontSize: fontSize * 0.5 }}>
          {nextLine && (
            <>
              <span className="font-bold">{nextLine.character}: </span>
              {nextLine.text}
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / dialogueLines.length) * 100}%` }}
        />
      </div>

      {/* Controls overlay — auto-hides */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8 transition-opacity duration-500 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ transform: mirrorMode ? "scaleX(-1)" : "none" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                try { document.exitFullscreen(); } catch {}
                router.back();
              }}
              className="text-white/60 hover:text-white text-base"
            >
              Exit
            </button>
            <span className="text-white/40 text-base">
              {currentIdx + 1} / {dialogueLines.length}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-white/60 text-base">
              <input
                type="checkbox"
                checked={mirrorMode}
                onChange={(e) => { e.stopPropagation(); setMirrorMode(!mirrorMode); }}
                className="accent-accent"
              />
              Mirror
            </label>
            <div className="flex items-center gap-2 text-white/60 text-base">
              <span>Aa</span>
              <input
                type="range"
                min={32}
                max={96}
                value={fontSize}
                onChange={(e) => { e.stopPropagation(); setFontSize(parseInt(e.target.value)); }}
                onClick={(e) => e.stopPropagation()}
                className="w-24 accent-accent"
              />
              <span className="text-lg font-bold">Aa</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIdx((p) => Math.max(0, p - 1)); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIdx((p) => Math.min(dialogueLines.length - 1, p + 1)); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
