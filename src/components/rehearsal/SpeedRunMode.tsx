"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ScriptLine } from "@/types";

interface SpeedRunScore {
  averageTime: number;
  fastest: number;
  slowest: number;
  linesUnder2s: number;
  totalLines: number;
  times: number[];
}

interface SpeedRunModeProps {
  lines: ScriptLine[];
  myCharacter: string;
  onComplete: (score: SpeedRunScore) => void;
}

function getLastNWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text;
  return "..." + words.slice(-n).join(" ");
}

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(2) + "s";
}

export default function SpeedRunMode({
  lines,
  myCharacter,
  onComplete,
}: SpeedRunModeProps) {
  // Build pairs: cue line -> your line
  const pairs = useRef<{ cue: ScriptLine; yourLine: ScriptLine }[]>([]);

  if (pairs.current.length === 0) {
    const dialogueLines = lines.filter((l) => l.type === "dialogue");
    for (let i = 0; i < dialogueLines.length; i++) {
      if (
        dialogueLines[i].character === myCharacter &&
        i > 0 &&
        dialogueLines[i - 1].character !== myCharacter
      ) {
        pairs.current.push({
          cue: dialogueLines[i - 1],
          yourLine: dialogueLines[i],
        });
      }
    }
  }

  const [currentPair, setCurrentPair] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown before start
  useEffect(() => {
    if (!showCountdown) return;
    if (countdown <= 0) {
      setShowCountdown(false);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, showCountdown]);

  // Start timer when cue appears
  useEffect(() => {
    if (showCountdown || isFinished) return;
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPair, showCountdown, isFinished]);

  const handleGotIt = useCallback(() => {
    if (isFinished || showCountdown) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const time = Date.now() - startTimeRef.current;
    const newTimes = [...responseTimes, time];
    setResponseTimes(newTimes);

    if (currentPair + 1 >= pairs.current.length) {
      setIsFinished(true);
      const score: SpeedRunScore = {
        averageTime: newTimes.reduce((a, b) => a + b, 0) / newTimes.length,
        fastest: Math.min(...newTimes),
        slowest: Math.max(...newTimes),
        linesUnder2s: newTimes.filter((t) => t < 2000).length,
        totalLines: newTimes.length,
        times: newTimes,
      };
      onComplete(score);
    } else {
      setCurrentPair((p) => p + 1);
    }
  }, [isFinished, showCountdown, responseTimes, currentPair, onComplete]);

  // Space key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isFinished && !showCountdown) {
        e.preventDefault();
        handleGotIt();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGotIt, isFinished, showCountdown]);

  const getTimerColor = (ms: number): string => {
    if (ms < 2000) return "text-success";
    if (ms < 4000) return "text-warning";
    return "text-danger";
  };

  const getTrafficLight = (ms: number): { color: string; bg: string } => {
    if (ms < 2000) return { color: "bg-success", bg: "bg-success/20" };
    if (ms < 4000) return { color: "bg-warning", bg: "bg-warning/20" };
    return { color: "bg-danger", bg: "bg-danger/20" };
  };

  // No cue-response pairs available
  if (pairs.current.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl text-muted">No cue-response pairs found.</p>
          <p className="text-base text-muted mt-2">
            Speed Run requires lines from other characters before yours.
          </p>
        </div>
      </div>
    );
  }

  // Countdown screen
  if (showCountdown) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted text-lg mb-4 uppercase tracking-wide">
            Speed Run
          </p>
          <div className="text-8xl font-black text-accent animate-pulse">
            {countdown > 0 ? countdown : "GO!"}
          </div>
          <p className="text-muted mt-6 text-base">
            {pairs.current.length} cues to respond to
          </p>
        </div>
      </div>
    );
  }

  // Score card
  if (isFinished) {
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const fastest = Math.min(...responseTimes);
    const slowest = Math.max(...responseTimes);
    const under2 = responseTimes.filter((t) => t < 2000).length;

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">
            Speed Run Complete
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <p className="text-sm text-muted uppercase tracking-wide">
                Average
              </p>
              <p className={`text-3xl font-bold mt-1 ${getTimerColor(avg)}`}>
                {formatTime(avg)}
              </p>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <p className="text-sm text-muted uppercase tracking-wide">
                Fastest
              </p>
              <p className="text-3xl font-bold mt-1 text-success">
                {formatTime(fastest)}
              </p>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <p className="text-sm text-muted uppercase tracking-wide">
                Slowest
              </p>
              <p className="text-3xl font-bold mt-1 text-danger">
                {formatTime(slowest)}
              </p>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <p className="text-sm text-muted uppercase tracking-wide">
                Under 2s
              </p>
              <p className="text-3xl font-bold mt-1 text-accent-light">
                {under2}/{responseTimes.length}
              </p>
            </div>
          </div>

          {/* Per-line breakdown */}
          <div className="space-y-1.5">
            <p className="text-sm text-muted uppercase tracking-wide mb-2">
              Breakdown
            </p>
            {responseTimes.map((time, i) => {
              const light = getTrafficLight(time);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-surface-light/50 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-muted w-8">#{i + 1}</span>
                  <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className={`h-full ${light.color} rounded-full transition-all`}
                      style={{
                        width: `${Math.min(100, (time / 6000) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className={`text-sm font-mono font-medium ${getTimerColor(time)}`}>
                    {formatTime(time)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active speed run
  const pair = pairs.current[currentPair];
  const cueText = getLastNWords(pair.cue.text, 5);
  const light = getTrafficLight(elapsedMs);
  const totalScore = responseTimes.reduce(
    (acc, t) => acc + (t < 2000 ? 3 : t < 4000 ? 1 : 0),
    0
  );

  return (
    <div className="flex flex-col items-center min-h-[60vh] pt-8">
      {/* Score & Progress Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="bg-accent/20 text-accent-light font-bold text-lg px-4 py-2 rounded-full">
          Score: {totalScore}
        </div>
        <div className="text-muted text-base">
          {currentPair + 1} / {pairs.current.length}
        </div>
        <div className="flex gap-1">
          {responseTimes.map((t, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${getTrafficLight(t).color}`}
            />
          ))}
          {Array.from({
            length: pairs.current.length - responseTimes.length,
          }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-3 h-3 rounded-full bg-surface-light"
            />
          ))}
        </div>
      </div>

      {/* Timer & Traffic Light */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-6 h-6 rounded-full ${light.color} shadow-lg`} />
        <span className={`text-6xl font-mono font-black tabular-nums ${getTimerColor(elapsedMs)}`}>
          {(elapsedMs / 1000).toFixed(1)}
        </span>
      </div>

      {/* Cue */}
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full mb-6">
        <p className="text-sm text-accent-light uppercase tracking-wide mb-2 font-medium">
          {pair.cue.character} says:
        </p>
        <p className="text-2xl leading-relaxed text-foreground">{cueText}</p>
      </div>

      {/* Your turn indicator */}
      <div className="text-success text-lg font-semibold mb-6 flex items-center gap-2">
        <span className="w-3 h-3 bg-success rounded-full animate-pulse" />
        Your line as {pair.yourLine.character}
      </div>

      {/* Got It Button */}
      <button
        onClick={handleGotIt}
        className="bg-accent hover:bg-accent/80 text-white text-xl font-bold px-12 py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-accent/30"
      >
        Got it!
      </button>
      <p className="text-muted text-sm mt-3">or press Space</p>
    </div>
  );
}
