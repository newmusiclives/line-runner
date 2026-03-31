"use client";

import { useState, useEffect, useCallback, use } from "react";

type Command = "play" | "pause" | "resume" | "stop" | "restart" | "next" | "prev";

export default function RemoteControlPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedbackCommand, setFeedbackCommand] = useState<string | null>(null);

  // Try BroadcastChannel first (same browser)
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      const bc = new BroadcastChannel(`rehearsal-${sessionId}`);
      setChannel(bc);
      setConnected(true);

      bc.onmessage = (event) => {
        if (event.data.type === "status") {
          setIsPlaying(event.data.isPlaying || false);
          setIsPaused(event.data.isPaused || false);
        }
      };

      // Request initial status
      bc.postMessage({ type: "request-status" });

      return () => bc.close();
    } catch {
      // BroadcastChannel not available, fall back to polling
      setConnected(true);
    }
  }, [sessionId]);

  const sendCommand = useCallback(async (command: Command) => {
    setFeedbackCommand(command);
    setTimeout(() => setFeedbackCommand(null), 300);
    setLastCommand(command);

    // Track local state
    if (command === "play") { setIsPlaying(true); setIsPaused(false); }
    if (command === "pause") { setIsPaused(true); }
    if (command === "resume") { setIsPaused(false); }
    if (command === "stop") { setIsPlaying(false); setIsPaused(false); }
    if (command === "restart") { setIsPlaying(false); setIsPaused(false); }

    // Try BroadcastChannel first
    if (channel) {
      channel.postMessage({ type: "command", command });
    }

    // Also send to API for cross-device support
    try {
      await fetch(`/api/rehearsals/${sessionId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
    } catch {
      // Silently fail - BroadcastChannel may still work
    }
  }, [channel, sessionId]);

  const buttonBase = "w-full rounded-2xl font-bold text-xl py-6 transition-all active:scale-95 shadow-lg";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Remote Control</h1>
            <p className="text-xs text-muted">Session: {sessionId.slice(0, 8)}...</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-success" : "bg-danger"}`} />
            <span className="text-xs text-muted">{connected ? "Connected" : "Connecting..."}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Status */}
        <div className="bg-surface-light rounded-xl p-4 text-center">
          <p className="text-sm text-muted">
            {isPlaying && !isPaused && "Playing"}
            {isPaused && "Paused"}
            {!isPlaying && !isPaused && "Stopped"}
          </p>
          {lastCommand && (
            <p className="text-xs text-accent-light mt-1">Last: {lastCommand}</p>
          )}
        </div>

        {/* Main Play/Pause button */}
        {!isPlaying && !isPaused ? (
          <button
            onClick={() => sendCommand("play")}
            className={`${buttonBase} bg-success hover:bg-success/80 text-white ${feedbackCommand === "play" ? "scale-95" : ""}`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              START
            </div>
          </button>
        ) : isPaused ? (
          <button
            onClick={() => sendCommand("resume")}
            className={`${buttonBase} bg-warning hover:bg-warning/80 text-black ${feedbackCommand === "resume" ? "scale-95" : ""}`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              RESUME
            </div>
          </button>
        ) : (
          <button
            onClick={() => sendCommand("pause")}
            className={`${buttonBase} bg-warning hover:bg-warning/80 text-black ${feedbackCommand === "pause" ? "scale-95" : ""}`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              PAUSE
            </div>
          </button>
        )}

        {/* Stop */}
        <button
          onClick={() => sendCommand("stop")}
          className={`${buttonBase} bg-danger hover:bg-danger/80 text-white ${feedbackCommand === "stop" ? "scale-95" : ""}`}
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            STOP
          </div>
        </button>

        {/* Navigation row */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => sendCommand("prev")}
            className={`${buttonBase} bg-surface-light hover:bg-border text-foreground ${feedbackCommand === "prev" ? "scale-95" : ""}`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              PREV
            </div>
          </button>
          <button
            onClick={() => sendCommand("next")}
            className={`${buttonBase} bg-surface-light hover:bg-border text-foreground ${feedbackCommand === "next" ? "scale-95" : ""}`}
          >
            <div className="flex items-center justify-center gap-2">
              NEXT
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        </div>

        {/* Restart */}
        <button
          onClick={() => sendCommand("restart")}
          className={`${buttonBase} bg-accent/20 hover:bg-accent/30 text-accent-light ${feedbackCommand === "restart" ? "scale-95" : ""}`}
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            RESTART
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="bg-surface border-t border-border px-4 py-3 text-center">
        <p className="text-xs text-muted">
          Line Runner Remote Control
        </p>
      </div>
    </div>
  );
}
