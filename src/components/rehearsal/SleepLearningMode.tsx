"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ScriptLine, VoiceAssignment } from "@/types";
import { BrowserVoiceEngine } from "@/lib/voice-engine";

interface SleepLearningModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  voiceAssignments: VoiceAssignment[];
  onExit: () => void;
}

export default function SleepLearningMode({
  lines,
  myCharacter,
  voiceAssignments,
  onExit,
}: SleepLearningModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [currentLoop, setCurrentLoop] = useState(1);
  const [pauseBetween, setPauseBetween] = useState(4);
  const [maxLoops, setMaxLoops] = useState(0); // 0 = infinite
  const [sleepTimer, setSleepTimer] = useState<number>(60);
  const [volume, setVolume] = useState(70);
  const [dimScreen, setDimScreen] = useState(true);
  const [showCurrentLine, setShowCurrentLine] = useState(true);
  const [textOpacity, setTextOpacity] = useState(1);
  const [showSettings, setShowSettings] = useState(true);
  const voiceEngineRef = useRef<BrowserVoiceEngine | null>(null);
  const isPlayingRef = useRef(false);
  const timerStartRef = useRef<number>(0);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dialogueLines = lines.filter((l) => l.type === "dialogue");

  useEffect(() => {
    if (typeof window !== "undefined") {
      voiceEngineRef.current = new BrowserVoiceEngine();
    }
    return () => {
      voiceEngineRef.current?.stop();
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const getVoice = useCallback(
    (char: string) => voiceAssignments.find((va) => va.characterName === char),
    [voiceAssignments]
  );

  const speakAndAdvance = useCallback(
    (index: number) => {
      if (!isPlayingRef.current || !voiceEngineRef.current) return;

      const line = dialogueLines[index];
      if (!line) return;

      setCurrentLineIndex(index);

      // Fade text in then out
      if (showCurrentLine) {
        setTextOpacity(1);
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = setTimeout(() => {
          setTextOpacity(0);
        }, 4000);
      }

      const assignment = line.character ? getVoice(line.character) : null;
      if (!assignment) {
        // Use fallback: still announce the line via speech synthesis
        const utterance = new SpeechSynthesisUtterance(line.text);
        utterance.volume = volume / 100;
        utterance.rate = 0.75;
        const voices = speechSynthesis.getVoices();
        const enVoice = voices.find((v) => v.lang.startsWith("en") && v.localService);
        if (enVoice) utterance.voice = enVoice;
        utterance.onend = () => {
          if (!isPlayingRef.current) return;
          scheduleNext(index);
        };
        utterance.onerror = () => {
          if (!isPlayingRef.current) return;
          scheduleNext(index);
        };
        speechSynthesis.speak(utterance);
        return;
      }

      const adjustedAssignment = {
        ...assignment,
        rate: assignment.rate * 0.75,
      };

      voiceEngineRef.current.speak(line.text, adjustedAssignment, () => {
        if (!isPlayingRef.current) return;
        scheduleNext(index);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dialogueLines, getVoice, volume, showCurrentLine]
  );

  const scheduleNext = useCallback(
    (index: number) => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => {
        if (!isPlayingRef.current) return;
        const nextIdx = index + 1;
        if (nextIdx >= dialogueLines.length) {
          // End of script - decide whether to loop
          const nextLoop = currentLoop + 1;
          if (maxLoops > 0 && nextLoop > maxLoops) {
            setIsPlaying(false);
            return;
          }
          setCurrentLoop(nextLoop);
          setLoopCount((c) => c + 1);
          speakAndAdvance(0);
        } else {
          speakAndAdvance(nextIdx);
        }
      }, pauseBetween * 1000);
    },
    [dialogueLines.length, currentLoop, maxLoops, pauseBetween, speakAndAdvance]
  );

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    setShowSettings(false);
    timerStartRef.current = Date.now();

    // Set sleep timer
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      voiceEngineRef.current?.stop();
      speechSynthesis.cancel();
    }, sleepTimer * 60 * 1000);

    setTimeout(() => speakAndAdvance(currentLineIndex), 500);
  }, [currentLineIndex, sleepTimer, speakAndAdvance]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    voiceEngineRef.current?.stop();
    speechSynthesis.cancel();
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  }, []);

  const progress =
    dialogueLines.length > 0
      ? ((currentLineIndex + 1) / dialogueLines.length) * 100
      : 0;

  const currentLine = dialogueLines[currentLineIndex];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-all duration-1000 ${
        dimScreen && isPlaying ? "bg-[#050508]" : "bg-background"
      }`}
      onClick={() => {
        // Tap to wake screen briefly
        if (dimScreen && isPlaying) {
          setShowSettings(false);
        }
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-6 py-4 transition-opacity duration-1000 ${
          dimScreen && isPlaying ? "opacity-20" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-6 h-6 ${isPlaying ? "text-indigo-400" : "text-muted"}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            />
          </svg>
          <div>
            <h2 className="font-semibold text-sm">Sleep Learning</h2>
            {isPlaying && (
              <p className="text-xs text-muted">
                Loop {currentLoop}
                {maxLoops > 0 ? ` / ${maxLoops}` : ""} -- Line{" "}
                {currentLineIndex + 1}/{dialogueLines.length}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            stopPlayback();
            onExit();
          }}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Exit
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Current line display */}
        {isPlaying && showCurrentLine && currentLine && (
          <div
            className="text-center max-w-2xl transition-opacity duration-[2000ms]"
            style={{ opacity: dimScreen ? textOpacity * 0.4 : textOpacity }}
          >
            <p className="text-white/20 text-xs uppercase tracking-[0.2em] mb-4">
              {currentLine.character}
            </p>
            <p className="text-white/40 text-xl md:text-2xl leading-relaxed font-light">
              {currentLine.text}
            </p>
          </div>
        )}

        {/* Settings panel (shown when not playing) */}
        {!isPlaying && showSettings && (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center mb-8">
              <svg
                className="w-16 h-16 text-indigo-400/40 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2">Sleep Learning</h2>
              <p className="text-muted text-sm max-w-sm mx-auto">
                Auto-plays all lines on a loop with no interaction required. Set
                your preferences, hit play, and close your eyes.
              </p>
            </div>

            {/* Pause between lines */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">
                  Pause Between Lines
                </label>
                <span className="text-sm font-mono text-accent-light">
                  {pauseBetween}s
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={pauseBetween}
                onChange={(e) => setPauseBetween(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Loop count */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Loops</label>
                <span className="text-sm font-mono text-accent-light">
                  {maxLoops === 0 ? "Infinite" : maxLoops}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={maxLoops}
                onChange={(e) => setMaxLoops(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-sm font-mono text-accent-light">
                  {volume}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Sleep timer */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sleep Timer
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSleepTimer(mins)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      sleepTimer === mins
                        ? "bg-accent text-white"
                        : "bg-surface-light text-muted hover:text-foreground hover:bg-border"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dimScreen}
                  onChange={(e) => setDimScreen(e.target.checked)}
                  className="accent-accent"
                />
                <span className="text-sm">Dim screen during playback</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCurrentLine}
                  onChange={(e) => setShowCurrentLine(e.target.checked)}
                  className="accent-accent"
                />
                <span className="text-sm">
                  Show current line (fades after 4s)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Prompt when not playing and settings hidden */}
        {!isPlaying && !showSettings && (
          <button
            onClick={() => setShowSettings(true)}
            className="text-muted hover:text-foreground text-sm transition-colors"
          >
            Show settings
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div
        className={`px-6 pb-8 transition-opacity duration-1000 ${
          dimScreen && isPlaying ? "opacity-20 hover:opacity-80" : "opacity-100"
        }`}
      >
        {/* Progress bar */}
        {isPlaying && (
          <div className="max-w-md mx-auto mb-4">
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500/40 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {!isPlaying ? (
            <button
              onClick={startPlayback}
              className="bg-accent hover:bg-accent-dark text-white font-medium px-8 py-3 rounded-xl transition-colors shadow-lg shadow-accent/25 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              Start Sleep Learning
            </button>
          ) : (
            <button
              onClick={stopPlayback}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause
            </button>
          )}
        </div>

        {isPlaying && (
          <p className="text-center text-xs text-muted/40 mt-3">
            Auto-stops after {sleepTimer} minutes
          </p>
        )}
      </div>
    </div>
  );
}
