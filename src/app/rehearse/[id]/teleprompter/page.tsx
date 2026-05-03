"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { RehearsalSession, ScriptLine } from "@/types";

export default function TeleprompterPage() {
  const router = useRouter();
  const [session, setSession] = useState<RehearsalSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return 28;
    return 48;
  });
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

  // Initial countdown — do not call setState synchronously in effect body
  useEffect(() => {
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

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
      <div
        className="absolute left-1/2 -translate-x-1/2 z-50"
        style={{ top: "max(2rem, env(safe-area-inset-top))" }}
      >
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${cueColor} shadow-[0_0_60px]`} />
      </div>

      {/* Script Lines — 3 line display */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 gap-4 sm:gap-6 pt-20 sm:pt-24">
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
          <div className="text-sm sm:text-lg uppercase tracking-widest mb-2 sm:mb-3 opacity-60">
            {currLine?.character}
            {isMyCurrent && " (YOU)"}
          </div>
          <div className="leading-tight">{currLine?.text}</div>
          {isMyCurrent && (
            <div className="mt-3 sm:mt-4 text-sm sm:text-lg text-green-400/70 animate-pulse">
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
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 sm:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-500 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ transform: mirrorMode ? "scaleX(-1)" : "none" }}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                try { document.exitFullscreen(); } catch {}
                router.back();
              }}
              className="text-white/70 hover:text-white text-base font-medium tap-target px-3 -ml-3 rounded-lg flex items-center"
            >
              Exit
            </button>
            <span className="text-white/40 text-sm sm:text-base">
              {currentIdx + 1} / {dialogueLines.length}
            </span>
            <div className="flex gap-2 sm:hidden ml-auto">
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentIdx((p) => Math.max(0, p - 1)); }}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="Previous line"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentIdx((p) => Math.min(dialogueLines.length - 1, p + 1)); }}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="Next line"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-wrap">
            <label className="flex items-center gap-2 text-white/70 text-sm sm:text-base">
              <input
                type="checkbox"
                checked={mirrorMode}
                onChange={(e) => { e.stopPropagation(); setMirrorMode(!mirrorMode); }}
                className="accent-accent w-4 h-4"
              />
              Mirror
            </label>
            <div className="flex items-center gap-2 text-white/70 text-sm sm:text-base flex-1 sm:flex-initial">
              <span>Aa</span>
              <input
                type="range"
                min={20}
                max={96}
                value={fontSize}
                onChange={(e) => { e.stopPropagation(); setFontSize(parseInt(e.target.value)); }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 sm:w-24 accent-accent"
              />
              <span className="text-base sm:text-lg font-bold">Aa</span>
            </div>
          </div>

          <div className="hidden sm:flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIdx((p) => Math.max(0, p - 1)); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Previous line"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIdx((p) => Math.min(dialogueLines.length - 1, p + 1)); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Next line"
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
