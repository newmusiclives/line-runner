"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
  inhale?: number;
  hold?: number;
  exhale?: number;
  cycles?: number;
  countdownSecs?: number;
}

type Phase = "breathing" | "countdown" | "done";
type BreathPhase = "inhale" | "hold" | "exhale";

export default function PreAuditionRitual({ onComplete, onSkip, inhale = 4, hold = 4, exhale = 6, cycles = 3, countdownSecs = 5 }: Props) {
  const [phase, setPhase] = useState<Phase>("breathing");
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("inhale");
  const [currentCycle, setCurrentCycle] = useState(1);
  const [countdown, setCountdown] = useState(countdownSecs);
  const [breathProgress, setBreathProgress] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const advanceBreath = useCallback(() => {
    setBreathPhase((prev) => {
      if (prev === "inhale") return "hold";
      if (prev === "hold") return "exhale";
      // exhale -> next cycle or move to countdown
      setCurrentCycle((c) => {
        if (c >= cycles) {
          setPhase("countdown");
          return c;
        }
        return c + 1;
      });
      return "inhale";
    });
    setBreathProgress(0);
  }, [cycles]);

  // Breathing animation
  useEffect(() => {
    if (phase !== "breathing") return;
    const duration = breathPhase === "inhale" ? inhale : breathPhase === "hold" ? hold : exhale;
    const intervalMs = 50;
    const steps = (duration * 1000) / intervalMs;
    let step = 0;

    animRef.current = setInterval(() => {
      step++;
      setBreathProgress(step / steps);
      if (step >= steps) {
        clearInterval(animRef.current);
        advanceBreath();
      }
    }, intervalMs);

    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [phase, breathPhase, inhale, hold, exhale, advanceBreath]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { onComplete(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, onComplete]);

  const circleScale = breathPhase === "inhale" ? 1 + breathProgress * 0.5 : breathPhase === "hold" ? 1.5 : 1.5 - breathProgress * 0.5;

  const breathLabel = breathPhase === "inhale" ? "Breathe in..." : breathPhase === "hold" ? "Hold..." : "Breathe out...";

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      <button onClick={onSkip} className="absolute top-6 right-6 text-sm text-muted hover:text-foreground transition-colors">
        Skip
      </button>

      {phase === "breathing" && (
        <div className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <div
              className="absolute inset-0 rounded-full bg-accent/20 border-2 border-accent/40 transition-transform"
              style={{ transform: `scale(${circleScale})`, transformOrigin: "center" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-medium text-accent-light">{breathLabel}</span>
            </div>
          </div>
          <p className="text-muted text-sm">Breath {currentCycle} of {cycles}</p>
        </div>
      )}

      {phase === "countdown" && (
        <div className="text-center">
          <div className="w-32 h-32 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl font-bold text-accent-light">{countdown}</span>
          </div>
          <p className="text-lg text-muted">Scene starting...</p>
        </div>
      )}
    </div>
  );
}
