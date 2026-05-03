"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ScriptLine } from "@/types";

interface TeleprompterModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  isPlaying: boolean;
  isPaused: boolean;
}

export default function TeleprompterMode({
  lines,
  myCharacter,
  isPlaying,
  isPaused,
}: TeleprompterModeProps) {
  const [scrollSpeed, setScrollSpeed] = useState(30); // pixels per second
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return 28;
    return 36;
  });
  const [mirrorMode, setMirrorMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dialogueLines = lines.filter((l) => l.type === "dialogue");

  // Auto-scroll animation
  useEffect(() => {
    if (!isPlaying || isPaused) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (scrollRef.current) {
        scrollRef.current.scrollTop += scrollSpeed * delta;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isPaused, scrollSpeed]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  return (
    <div
      className="relative flex-1 flex flex-col bg-black overflow-hidden"
      style={{ transform: mirrorMode ? "scaleX(-1)" : "none" }}
      onMouseMove={showControlsTemporarily}
      onClick={showControlsTemporarily}
    >
      {/* Gradient overlays for readability */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

      {/* Center line indicator */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-px h-0.5 bg-accent/30 z-10 pointer-events-none" />

      {/* Scrolling content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-8"
        style={{ scrollBehavior: "auto" }}
      >
        {/* Top spacer */}
        <div className="h-[50vh]" />

        <div className="max-w-4xl mx-auto space-y-6">
          {dialogueLines.map((line) => {
            const isMyLine = line.character === myCharacter;
            return (
              <div key={line.id} className="text-center">
                <p
                  className={`text-sm uppercase tracking-widest mb-2 ${
                    isMyLine ? "text-green-400" : "text-accent-light/60"
                  }`}
                  style={{ fontSize: fontSize * 0.35 }}
                >
                  {line.character}
                  {isMyLine && " (YOU)"}
                </p>
                <p
                  className={`leading-relaxed ${
                    isMyLine ? "text-green-300 font-semibold" : "text-white"
                  }`}
                  style={{ fontSize }}
                >
                  {line.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom spacer */}
        <div className="h-[50vh]" />
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 sm:px-6 py-5 sm:py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] z-20 transition-opacity duration-500 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ transform: mirrorMode ? "scaleX(-1)" : "none" }}
      >
        <div className="max-w-xl mx-auto space-y-4">
          {/* Scroll Speed */}
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm w-20 shrink-0">Speed</span>
            <input
              type="range"
              min={5}
              max={100}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
              className="flex-1 accent-accent"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-white/80 text-sm font-mono w-12 text-right">{scrollSpeed}</span>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm w-20 shrink-0">Size</span>
            <input
              type="range"
              min={20}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="flex-1 accent-accent"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-white/80 text-sm font-mono w-12 text-right">{fontSize}px</span>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center justify-center gap-4">
            <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={mirrorMode}
                onChange={() => setMirrorMode(!mirrorMode)}
                className="accent-accent"
                onClick={(e) => e.stopPropagation()}
              />
              Mirror
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
