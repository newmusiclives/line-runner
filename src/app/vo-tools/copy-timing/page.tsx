"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface TimingResult {
  duration: number;
  wpm: number;
  onTarget: boolean;
  diff: number;
}

export default function CopyTimingPage() {
  const [targetDuration, setTargetDuration] = useState(30);
  const [isReading, setIsReading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<TimingResult[]>([]);
  const [scriptText, setScriptText] = useState(
    "This weekend only at Riverside Motors -- every vehicle in our lot is priced to move. Zero down, zero interest for 60 months on select models. Trucks, SUVs, sedans -- if it has four wheels, we have got a deal for you. Riverside Motors, where the road meets the river."
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const targetWpm = wordCount > 0 && targetDuration > 0 ? Math.round((wordCount / targetDuration) * 60) : 0;

  const startReading = useCallback(async () => {
    setElapsed(0);
    setRecordingBlob(null);
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
    }
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);
    setIsReading(true);

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordingBlob(blob);
        setPlaybackUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
    } catch {
      // Recording failed but timer still works
    }
  }, [playbackUrl]);

  const stopReading = useCallback(() => {
    setIsReading(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const finalDuration = (Date.now() - startTimeRef.current) / 1000;
    const wpm = Math.round((wordCount / finalDuration) * 60);
    const diff = Math.round((finalDuration - targetDuration) * 10) / 10;
    const onTarget = Math.abs(finalDuration - targetDuration) <= targetDuration * 0.1;
    setResults((prev) => [...prev, { duration: Math.round(finalDuration * 10) / 10, wpm, onTarget, diff }]);

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, [targetDuration, wordCount]);

  const playBack = () => {
    if (!playbackUrl) return;
    const audio = new Audio(playbackUrl);
    audio.play();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progressPercent = Math.min(100, (elapsed / targetDuration) * 100);
  const remaining = Math.max(0, targetDuration - elapsed);
  const isOvertime = elapsed > targetDuration;
  const isInAmberZone = remaining <= 5 && remaining > 0;

  const barColor = isOvertime ? "bg-danger" : isInAmberZone ? "bg-warning" : "bg-success";
  const avgWpm = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length) : null;

  // Live pace indicator
  const currentWpm = isReading && elapsed > 0 ? Math.round((wordCount / elapsed) * (elapsed / targetDuration) * 60 / (wordCount / targetDuration / 60 * elapsed / wordCount) || 0) : 0;
  const paceStatus = isReading && elapsed > 1
    ? elapsed < targetDuration * 0.9 && progressPercent > (elapsed / targetDuration) * 100 + 5
      ? "ahead"
      : elapsed > targetDuration * 0.9 && progressPercent < 85
      ? "behind"
      : "on-pace"
    : "on-pace";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Copy Timing Calibrator</h1>
      <p className="text-muted mb-8">Match your read to the exact time slot. Hit the mark every time.</p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Script Area */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Copy</h2>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span>{wordCount} words</span>
                <span>Target: {targetWpm} wpm</span>
              </div>
            </div>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={6}
              disabled={isReading}
              className="w-full bg-surface-light border border-border rounded-xl p-4 text-lg leading-relaxed focus:outline-none focus:border-accent resize-none disabled:opacity-60"
              placeholder="Paste your copy here..."
            />
          </div>

          {/* Timer Bar */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">Target: {targetDuration}s</span>
              <span className={`text-2xl font-mono font-bold ${isOvertime ? "text-danger" : isInAmberZone ? "text-warning" : "text-success"}`}>
                {elapsed.toFixed(1)}s
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-4 bg-surface-light rounded-full overflow-hidden mb-2">
              <div className={`h-full ${barColor} transition-all duration-100 rounded-full`} style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>

            {/* Countdown */}
            {isReading && (
              <div className="text-center mb-4">
                <span className={`text-4xl font-mono font-bold ${isOvertime ? "text-danger" : remaining <= 5 ? "text-warning" : "text-foreground"}`}>
                  {isOvertime ? `+${(elapsed - targetDuration).toFixed(1)}` : remaining.toFixed(1)}
                </span>
                <span className="text-sm text-muted ml-2">{isOvertime ? "over" : "remaining"}</span>
              </div>
            )}

            {/* Pace Indicator */}
            {isReading && elapsed > 1 && (
              <div className={`text-center text-sm font-medium mb-4 ${
                paceStatus === "ahead" ? "text-warning" : paceStatus === "behind" ? "text-danger" : "text-success"
              }`}>
                {paceStatus === "ahead" ? "You are ahead of pace -- slow down" :
                 paceStatus === "behind" ? "You are behind pace -- pick it up" :
                 "On pace -- keep it steady"}
              </div>
            )}

            {/* Labels */}
            <div className="flex justify-between text-xs text-muted mb-6">
              <span>0s</span>
              <span className="text-warning">{targetDuration - 5}s</span>
              <span className={isOvertime ? "text-danger font-bold" : ""}>{targetDuration}s</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isReading ? (
                <button onClick={startReading} disabled={!scriptText.trim()} className="bg-success hover:bg-success/80 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-40">
                  Start Reading
                </button>
              ) : (
                <button onClick={stopReading} className="bg-danger hover:bg-danger/80 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                  Stop
                </button>
              )}
              {recordingBlob && !isReading && (
                <button onClick={playBack} className="bg-surface-light hover:bg-border text-foreground font-medium px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  Play Back
                </button>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-danger">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                Recording
              </div>
            )}
          </div>
        </div>

        {/* Settings & Results */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Target Duration</h3>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((d) => (
                <button key={d} onClick={() => setTargetDuration(d)} className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${targetDuration === d ? "bg-accent text-white" : "bg-surface-light text-muted hover:text-foreground"}`}>
                  {d}s
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-sm text-muted block mb-1">Custom (seconds)</label>
              <input type="number" min={5} max={300} step={0.5} value={targetDuration} onChange={(e) => setTargetDuration(parseFloat(e.target.value) || 30)} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          {avgWpm && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">Your Baseline</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-light">{avgWpm}</div>
                <div className="text-sm text-muted">avg words/min</div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">Take History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {[...results].reverse().map((r, i) => (
                  <div key={i} className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${r.onTarget ? "bg-success/10" : "bg-danger/10"}`}>
                    <span className="text-muted">Take {results.length - i}</span>
                    <span className="font-mono">{r.duration}s</span>
                    <span>{r.wpm} wpm</span>
                    <span className={r.onTarget ? "text-success" : "text-danger"}>
                      {r.onTarget ? "HIT" : r.diff > 0 ? `+${r.diff}s` : `${r.diff}s`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
