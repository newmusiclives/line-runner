"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BrowserVoiceEngine } from "@/lib/voice-engine";
import type { RehearsalSession, ScriptLine, VoiceAssignment } from "@/types";

export default function RehearsePage() {
  const router = useRouter();
  const [session, setSession] = useState<RehearsalSession | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [pauseDuration, setPauseDuration] = useState(3);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const voiceEngineRef = useRef<BrowserVoiceEngine | null>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const data = sessionStorage.getItem("rehearsal-session");
    if (data) {
      const parsed = JSON.parse(data) as RehearsalSession;
      setSession(parsed);
    } else {
      router.push("/upload");
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      voiceEngineRef.current = new BrowserVoiceEngine();
    }
    return () => {
      voiceEngineRef.current?.stop();
    };
  }, []);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex]);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const getVoiceForCharacter = useCallback(
    (characterName: string): VoiceAssignment | undefined => {
      return session?.voiceAssignments.find(
        (va) => va.characterName === characterName
      );
    },
    [session]
  );

  const advanceLine = useCallback(() => {
    if (!session) return;
    const dialogueLines = session.script.lines.filter(
      (l) => l.type === "dialogue"
    );

    setCurrentLineIndex((prev) => {
      const next = prev + 1;
      if (next >= dialogueLines.length) {
        setIsPlaying(false);
        return prev;
      }
      return next;
    });
  }, [session]);

  const speakLine = useCallback(
    (line: ScriptLine) => {
      if (!voiceEngineRef.current || !line.character) return;

      const assignment = getVoiceForCharacter(line.character);
      if (!assignment) return;

      voiceEngineRef.current.speak(line.text, assignment, () => {
        if (isPlayingRef.current) {
          advanceLine();
        }
      });
    },
    [getVoiceForCharacter, advanceLine]
  );

  // Handle line changes during playback
  useEffect(() => {
    if (!session || !isPlaying) return;

    const dialogueLines = session.script.lines.filter(
      (l) => l.type === "dialogue"
    );
    const currentLine = dialogueLines[currentLineIndex];
    if (!currentLine) return;

    if (currentLine.character === session.myCharacter) {
      // It's the user's line
      setWaitingForUser(true);
      voiceEngineRef.current?.stop();

      if (autoAdvance) {
        const timeout = setTimeout(() => {
          setWaitingForUser(false);
          advanceLine();
        }, pauseDuration * 1000);
        return () => clearTimeout(timeout);
      }
    } else {
      // AI's line — speak it
      setWaitingForUser(false);
      speakLine(currentLine);
    }
  }, [
    currentLineIndex,
    isPlaying,
    session,
    autoAdvance,
    pauseDuration,
    speakLine,
    advanceLine,
  ]);

  const togglePlay = () => {
    if (isPlaying) {
      voiceEngineRef.current?.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const skipLine = () => {
    voiceEngineRef.current?.stop();
    setWaitingForUser(false);
    advanceLine();
  };

  const goBack = () => {
    voiceEngineRef.current?.stop();
    setWaitingForUser(false);
    setCurrentLineIndex((prev) => Math.max(0, prev - 1));
  };

  const restart = () => {
    voiceEngineRef.current?.stop();
    setWaitingForUser(false);
    setCurrentLineIndex(0);
    setIsPlaying(false);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const dialogueLines = session.script.lines.filter(
    (l) => l.type === "dialogue"
  );
  const progress =
    dialogueLines.length > 0
      ? ((currentLineIndex + 1) / dialogueLines.length) * 100
      : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header Bar */}
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{session.script.title}</h1>
            <p className="text-base text-muted">
              Playing as{" "}
              <span className="text-success font-medium">
                {session.myCharacter}
              </span>{" "}
              &middot; Line {currentLineIndex + 1} of {dialogueLines.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-base text-muted">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="accent-accent"
                />
                Auto-advance
              </label>
              {autoAdvance && (
                <select
                  value={pauseDuration}
                  onChange={(e) => setPauseDuration(parseInt(e.target.value))}
                  className="bg-surface-light border border-border rounded px-2 py-1 text-sm"
                >
                  <option value={2}>2s pause</option>
                  <option value={3}>3s pause</option>
                  <option value={5}>5s pause</option>
                  <option value={8}>8s pause</option>
                  <option value={10}>10s pause</option>
                </select>
              )}
            </div>

            <button
              onClick={() => router.push("/upload")}
              className="text-base text-muted hover:text-foreground"
            >
              New Script
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-5xl mx-auto mt-2">
          <div className="h-1 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Script View */}
      <div
        ref={scriptContainerRef}
        className="flex-1 overflow-y-auto py-6"
      >
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          {dialogueLines.map((line, index) => {
            const isCurrentLine = index === currentLineIndex;
            const isMyLine = line.character === session.myCharacter;
            const isDone = index < currentLineIndex;

            return (
              <div
                key={line.id}
                ref={isCurrentLine ? currentLineRef : undefined}
                className={`rounded-xl p-4 transition-all cursor-pointer ${
                  isCurrentLine
                    ? isMyLine
                      ? "line-my-turn"
                      : "line-active"
                    : isDone
                      ? "line-done"
                      : ""
                } hover:bg-surface-light/50`}
                onClick={() => {
                  voiceEngineRef.current?.stop();
                  setCurrentLineIndex(index);
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`text-sm font-bold uppercase tracking-wide pt-0.5 w-24 shrink-0 ${
                      isMyLine ? "text-success" : "text-accent-light"
                    }`}
                  >
                    {line.character}
                    {isMyLine && (
                      <span className="block text-xs font-normal opacity-70 normal-case">
                        (You)
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-base leading-relaxed ${isDone ? "text-muted" : "text-foreground"}`}
                  >
                    {line.text}
                  </p>
                </div>

                {isCurrentLine && isMyLine && waitingForUser && (
                  <div className="mt-3 ml-27 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-base text-success">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Your line — speak now
                    </div>
                    {!autoAdvance && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWaitingForUser(false);
                          advanceLine();
                        }}
                        className="text-sm bg-success/20 text-success px-3 py-1 rounded-full hover:bg-success/30 transition-colors"
                      >
                        Done
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {currentLineIndex >= dialogueLines.length - 1 && !isPlaying && (
            <div className="text-center py-12">
              <div className="text-2xl font-bold mb-2">Scene Complete!</div>
              <p className="text-muted mb-6">
                Great rehearsal. Want to run it again?
              </p>
              <button
                onClick={restart}
                className="bg-accent hover:bg-accent-dark text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
              >
                Restart from Beginning
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-surface border-t border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={restart}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors"
            title="Restart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>

          <button
            onClick={goBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors"
            title="Previous line"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-accent hover:bg-accent-dark transition-colors shadow-lg shadow-accent/25"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>

          <button
            onClick={skipLine}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors"
            title="Next line"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => voiceEngineRef.current?.stop()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors"
            title="Stop voice"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
