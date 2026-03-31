"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export default function CopyTimingPage() {
  const [targetDuration, setTargetDuration] = useState(30);
  const [isReading, setIsReading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<{ duration: number; wpm: number; onTarget: boolean }[]>([]);
  const [scriptText, setScriptText] = useState("This weekend only at Riverside Motors — every vehicle in our lot is priced to move. Zero down, zero interest for 60 months on select models. Trucks, SUVs, sedans — if it has four wheels, we've got a deal for you. Riverside Motors, where the road meets the river.");
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef(0);

  const wordCount = scriptText.trim().split(/\s+/).length;

  const startReading = useCallback(() => {
    setIsReading(true);
    setElapsed(0);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);
  }, []);

  const stopReading = useCallback(() => {
    setIsReading(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const finalDuration = (Date.now() - startTimeRef.current) / 1000;
    const wpm = Math.round((wordCount / finalDuration) * 60);
    const onTarget = Math.abs(finalDuration - targetDuration) <= targetDuration * 0.1;
    setResults((prev) => [...prev, { duration: Math.round(finalDuration * 10) / 10, wpm, onTarget }]);
  }, [targetDuration, wordCount]);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const progressPercent = Math.min(100, (elapsed / targetDuration) * 100);
  const remaining = Math.max(0, targetDuration - elapsed);
  const isInSafeZone = elapsed <= targetDuration;
  const isInAmberZone = remaining <= 5 && remaining > 0;
  const isOvertime = elapsed > targetDuration;

  const barColor = isOvertime ? "bg-danger" : isInAmberZone ? "bg-warning" : "bg-success";
  const avgWpm = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length) : null;

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
              <span className="text-sm text-muted">{wordCount} words</span>
            </div>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={6}
              className="w-full bg-surface-light border border-border rounded-xl p-4 text-lg leading-relaxed focus:outline-none focus:border-accent resize-none"
              placeholder="Paste your copy here..."
            />
          </div>

          {/* Timer Bar */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">Target: {targetDuration}s</span>
              <span className={`text-2xl font-mono font-bold ${isOvertime ? "text-danger speed-urgent" : isInAmberZone ? "text-warning" : "text-success"}`}>
                {elapsed.toFixed(1)}s
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-4 bg-surface-light rounded-full overflow-hidden mb-4">
              <div className={`h-full ${barColor} transition-all duration-100 rounded-full`} style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>

            {/* Labels */}
            <div className="flex justify-between text-xs text-muted mb-6">
              <span>0s</span>
              <span className="text-warning">{targetDuration - 5}s</span>
              <span className={isOvertime ? "text-danger font-bold" : ""}>{targetDuration}s</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isReading ? (
                <button onClick={startReading} className="bg-success hover:bg-success/80 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                  Start Reading
                </button>
              ) : (
                <button onClick={stopReading} className="bg-danger hover:bg-danger/80 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                  Stop
                </button>
              )}
            </div>
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
                    <span className={r.onTarget ? "text-success" : "text-danger"}>{r.onTarget ? "HIT" : "MISS"}</span>
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
