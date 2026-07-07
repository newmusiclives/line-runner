"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseLineListenerOptions {
  enabled: boolean;
  expectedText: string;
  onMatch?: () => void;
  onSilence?: () => void;
  /**
   * Called when speech recognition cannot run at all for this line — mic
   * permission denied, a fatal recognition error, or start() throwing. The
   * caller should fall back to a timed pause so the scene never freezes on
   * the user's line.
   */
  onUnavailable?: () => void;
  matchThreshold?: number;
  silenceMs?: number;
  /**
   * Absolute ceiling (ms) from when the user's line becomes active. If the
   * actor never speaks (blanked on the line), advance anyway once this
   * elapses so a stuck actor is never stranded. Only fires while no speech
   * has been detected — once they start talking, normal silence detection
   * takes over and this ceiling is disarmed.
   */
  maxSilentWaitMs?: number;
  language?: string;
}

interface UseLineListenerResult {
  isSupported: boolean;
  isListening: boolean;
  partialTranscript: string;
  finalTranscript: string;
  matchScore: number;
  error: string | null;
  /** True once recognition has failed for this line (permission/fatal error). */
  unavailable: boolean;
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function computeMatchScore(spoken: string, expected: string): number {
  const expectedWords = normalizeWords(expected);
  if (expectedWords.length === 0) return 0;
  const spokenWords = normalizeWords(spoken);
  if (spokenWords.length === 0) return 0;

  // Multiset intersection: each expected word can be matched at most once.
  const remaining = new Map<string, number>();
  for (const w of expectedWords) {
    remaining.set(w, (remaining.get(w) ?? 0) + 1);
  }
  let matched = 0;
  for (const w of spokenWords) {
    const count = remaining.get(w) ?? 0;
    if (count > 0) {
      remaining.set(w, count - 1);
      matched++;
    }
  }
  return Math.min(matched / expectedWords.length, 1);
}

function getRecognitionConstructor(): unknown {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useLineListener({
  enabled,
  expectedText,
  onMatch,
  onSilence,
  onUnavailable,
  matchThreshold = 0.85,
  silenceMs = 2200,
  maxSilentWaitMs = 10000,
  language = "en-US",
}: UseLineListenerOptions): UseLineListenerResult {
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [matchScore, setMatchScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const recognitionRef = useRef<unknown>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ceilingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTextRef = useRef("");
  const hasSpokenRef = useRef(false);
  const matchedRef = useRef(false);
  const onMatchRef = useRef(onMatch);
  const onSilenceRef = useRef(onSilence);
  const onUnavailableRef = useRef(onUnavailable);

  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);
  useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);
  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  const isSupported =
    typeof window !== "undefined" && getRecognitionConstructor() !== null;

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (ceilingTimerRef.current) {
      clearTimeout(ceilingTimerRef.current);
      ceilingTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    const rec = recognitionRef.current as
      | {
          onresult: unknown;
          onend: unknown;
          onerror: unknown;
          stop: () => void;
        }
      | null;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearTimers]);

  useEffect(() => {
    if (!enabled || !isSupported || !expectedText.trim()) {
      stop();
      return;
    }

    const Ctor = getRecognitionConstructor() as
      | (new () => {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          maxAlternatives: number;
          onresult: ((event: unknown) => void) | null;
          onerror: ((event: unknown) => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        })
      | null;
    if (!Ctor) return;

    finalTextRef.current = "";
    hasSpokenRef.current = false;
    matchedRef.current = false;
    setPartialTranscript("");
    setFinalTranscript("");
    setMatchScore(0);
    setError(null);
    setUnavailable(false);

    // Fires the advance exactly once per line, cancelling any pending timers.
    const fireAdvance = () => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      clearTimers();
      onSilenceRef.current?.();
    };

    // Safety ceiling: if the actor never says anything (blanked on the line),
    // advance anyway once maxSilentWaitMs elapses. Disarmed as soon as any
    // speech is detected — from then on the silence timer governs pacing, so a
    // long soliloquy is never cut off by this.
    ceilingTimerRef.current = setTimeout(() => {
      if (!hasSpokenRef.current) fireAdvance();
    }, maxSilentWaitMs);

    // Recognition failed to run (permission denied / fatal error): tell the
    // caller so it can fall back to a timed pause instead of freezing here.
    const markUnavailable = () => {
      if (matchedRef.current) return;
      setUnavailable(true);
      clearTimers();
      onUnavailableRef.current?.();
    };

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language;
    rec.maxAlternatives = 1;

    rec.onresult = (event: unknown) => {
      const ev = event as {
        resultIndex: number;
        results: ArrayLike<{
          isFinal: boolean;
          0: { transcript: string; confidence: number };
        }>;
      };

      let interim = "";
      let newFinal = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const txt = r[0].transcript;
        if (r.isFinal) newFinal += txt + " ";
        else interim += txt + " ";
      }

      if (newFinal) {
        finalTextRef.current = (finalTextRef.current + " " + newFinal).trim();
        setFinalTranscript(finalTextRef.current);
      }
      setPartialTranscript(interim.trim());

      const heard = (finalTextRef.current + " " + interim).trim();
      if (heard) hasSpokenRef.current = true;

      const score = computeMatchScore(heard, expectedText);
      setMatchScore(score);

      // Never fire onMatch instantly when score crosses threshold mid-line —
      // on Shakespeare the user can cross 75% before they've actually finished
      // delivering the full line, which cuts them off. Always wait for an
      // actual silence gap; the wait length scales with how done the line is.
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (hasSpokenRef.current) {
        // Actor has started delivering — the safety ceiling no longer applies;
        // from here silence detection governs the pace.
        if (ceilingTimerRef.current) {
          clearTimeout(ceilingTimerRef.current);
          ceilingTimerRef.current = null;
        }
        // On long lines (Shakespeare soliloquies) the user can cross the
        // match threshold before they've actually finished delivering, with
        // breath pauses landing inside the snappy-wait window. 1000ms covers
        // a typical theatrical breath while still feeling responsive.
        let wait: number;
        if (score >= matchThreshold) wait = 1000;
        else if (score >= 0.25) wait = silenceMs;
        else wait = silenceMs * 2;
        silenceTimerRef.current = setTimeout(fireAdvance, wait);
      }
    };

    rec.onerror = (event: unknown) => {
      const err = (event as { error?: string })?.error ?? "speech-error";
      // 'no-speech' and 'aborted' are normal — let onend restart handle them.
      if (err === "no-speech" || err === "aborted") return;
      setError(err);
      // Permission/service problems mean recognition will never deliver
      // results for this line — hand off to the timed-pause fallback so the
      // scene keeps moving instead of stalling on the actor's line forever.
      if (
        err === "not-allowed" ||
        err === "service-not-allowed" ||
        err === "audio-capture"
      ) {
        markUnavailable();
      }
    };

    rec.onend = () => {
      if (recognitionRef.current !== rec || matchedRef.current) {
        return;
      }
      // iOS Safari and others auto-end; restart with a small delay.
      restartTimerRef.current = setTimeout(() => {
        if (recognitionRef.current === rec && !matchedRef.current) {
          try {
            rec.start();
          } catch {
            // ignore
          }
        }
      }, 200);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed-to-start");
      // start() throwing (already-started, insecure context, no mic) means we
      // can't listen for this line — fall back to a timed pause.
      markUnavailable();
    }

    return () => {
      stop();
    };
  }, [
    enabled,
    expectedText,
    language,
    matchThreshold,
    silenceMs,
    maxSilentWaitMs,
    isSupported,
    stop,
    clearTimers,
  ]);

  return {
    isSupported,
    isListening,
    partialTranscript,
    finalTranscript,
    matchScore,
    error,
    unavailable,
  };
}
