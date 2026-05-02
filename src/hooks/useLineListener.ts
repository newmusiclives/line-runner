"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseLineListenerOptions {
  enabled: boolean;
  expectedText: string;
  onMatch?: () => void;
  onSilence?: () => void;
  matchThreshold?: number;
  silenceMs?: number;
  language?: string;
}

interface UseLineListenerResult {
  isSupported: boolean;
  isListening: boolean;
  partialTranscript: string;
  finalTranscript: string;
  matchScore: number;
  error: string | null;
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
  matchThreshold = 0.55,
  silenceMs = 1500,
  language = "en-US",
}: UseLineListenerOptions): UseLineListenerResult {
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [matchScore, setMatchScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<unknown>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTextRef = useRef("");
  const hasSpokenRef = useRef(false);
  const matchedRef = useRef(false);
  const onMatchRef = useRef(onMatch);
  const onSilenceRef = useRef(onSilence);

  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);
  useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);

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

      if (score >= matchThreshold && !matchedRef.current) {
        matchedRef.current = true;
        clearTimers();
        onMatchRef.current?.();
        return;
      }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (hasSpokenRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (!matchedRef.current) {
            matchedRef.current = true;
            onSilenceRef.current?.();
          }
        }, silenceMs);
      }
    };

    rec.onerror = (event: unknown) => {
      const err = (event as { error?: string })?.error ?? "speech-error";
      // 'no-speech' and 'aborted' are normal — let onend restart handle them.
      if (err !== "no-speech" && err !== "aborted") {
        setError(err);
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
  };
}
