"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Take {
  id: string;
  number: number;
  syncScore: number;
  timestamp: string;
  duration: string;
}

function generateSyncScore(): number {
  return Math.round(65 + Math.random() * 30);
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-success";
  if (score >= 75) return "text-warning";
  return "text-danger";
}

function scoreBg(score: number): string {
  if (score >= 90) return "bg-success/15 border-success/30";
  if (score >= 75) return "bg-warning/15 border-warning/30";
  return "bg-danger/15 border-danger/30";
}

export default function ADRPage() {
  const [hasReference, setHasReference] = useState(false);
  const [referenceFileName, setReferenceFileName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [takes, setTakes] = useState<Take[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  const refCanvasRef = useRef<HTMLCanvasElement>(null);
  const recCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawMockWaveform = useCallback((canvas: HTMLCanvasElement, color: string, seed: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#2d2d3f";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += w / 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Waveform
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const t = x / w;
      const amplitude =
        (Math.sin(t * 30 + seed) * 0.3 +
          Math.sin(t * 80 + seed * 2) * 0.2 +
          Math.sin(t * 150 + seed * 3) * 0.1) *
        h *
        0.35;
      const y = h / 2 + amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Loop region marker
    if (loopStart !== null) {
      const lx = (loopStart / 20) * w;
      ctx.fillStyle = "rgba(108, 92, 231, 0.15)";
      ctx.fillRect(lx, 0, w * 0.15, h);
      ctx.strokeStyle = "#6c5ce7";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [loopStart]);

  useEffect(() => {
    if (hasReference && refCanvasRef.current) {
      drawMockWaveform(refCanvasRef.current, "#a29bfe", 1);
    }
  }, [hasReference, drawMockWaveform]);

  useEffect(() => {
    if (takes.length > 0 && recCanvasRef.current) {
      drawMockWaveform(recCanvasRef.current, "#00b894", takes.length);
    }
  }, [takes, drawMockWaveform]);

  const handleUploadReference = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReferenceFileName(e.target.files[0].name);
      setHasReference(true);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      const score = generateSyncScore();
      setCurrentScore(score);
      const newTake: Take = {
        id: `t-${Date.now()}`,
        number: takes.length + 1,
        syncScore: score,
        timestamp: new Date().toLocaleTimeString(),
        duration: `${(2 + Math.random() * 8).toFixed(1)}s`,
      };
      setTakes((prev) => [newTake, ...prev]);
    } else {
      setIsRecording(true);
      setCurrentScore(null);
    }
  };

  const handleLoopRecord = (timestamp: number) => {
    setLoopStart(timestamp);
    setIsLooping(true);
    setIsRecording(true);
    setCurrentScore(null);
  };

  const bestScore = takes.length > 0 ? Math.max(...takes.map((t) => t.syncScore)) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">ADR & Dubbing Mode</h1>
      <p className="text-muted mb-8">Lip-sync timing guide with waveform overlay for dubbing work.</p>

      {/* Upload Reference */}
      {!hasReference ? (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Upload Reference Audio/Video</h2>
          <input ref={fileInputRef} type="file" accept="audio/*,video/*" onChange={handleUploadReference} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-accent/30 transition-colors"
          >
            <svg className="w-12 h-12 mx-auto text-muted mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 0A1.125 1.125 0 013.375 4.5h17.25M21 5.625v12.75m0 0a1.125 1.125 0 01-1.125 1.125m1.125-1.125v-1.5" />
            </svg>
            <span className="text-muted">Upload reference audio or video file</span>
            <br />
            <span className="text-xs text-muted">WAV, MP3, MP4, MOV</span>
          </button>
        </div>
      ) : (
        <>
          {/* Reference Info */}
          <div className="flex items-center gap-3 mb-4 text-sm text-muted">
            <svg className="w-4 h-4 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Reference: {referenceFileName}
            <button onClick={() => { setHasReference(false); setReferenceFileName(""); }} className="text-xs text-danger hover:text-danger/80 ml-auto">
              Remove
            </button>
          </div>

          {/* Side-by-Side Waveforms */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-accent-light">Reference</h3>
                <button className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  Play
                </button>
              </div>
              <canvas ref={refCanvasRef} width={400} height={120} className="w-full h-28 rounded-lg bg-surface-light" />
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-success">Your Recording</h3>
                {takes.length > 0 && (
                  <button className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    Play
                  </button>
                )}
              </div>
              <canvas ref={recCanvasRef} width={400} height={120} className="w-full h-28 rounded-lg bg-surface-light" />
            </div>
          </div>

          {/* Record Controls */}
          <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                {isLooping && loopStart !== null && (
                  <span className="text-sm text-accent-light">Loop from {loopStart.toFixed(1)}s</span>
                )}
              </div>
              {isLooping && (
                <button onClick={() => { setIsLooping(false); setLoopStart(null); }} className="text-xs text-muted hover:text-foreground">
                  Exit Loop
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleRecord}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                  isRecording ? "bg-danger animate-pulse" : "bg-accent hover:bg-accent-dark"
                } text-white`}
              >
                {isRecording ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-muted">{isRecording ? "Recording take..." : "Record new take"}</span>
            </div>

            {/* Sync Score Display */}
            {currentScore !== null && (
              <div className={`mt-6 border rounded-xl p-6 text-center ${scoreBg(currentScore)}`}>
                <div className="text-sm text-muted mb-1">Sync Score</div>
                <div className={`text-5xl font-bold ${scoreColor(currentScore)}`}>{currentScore}%</div>
                <div className="text-xs text-muted mt-2">
                  {currentScore >= 90 ? "Excellent sync!" : currentScore >= 75 ? "Good - minor timing drift" : "Needs work - try loop recording on problem spots"}
                </div>
              </div>
            )}
          </div>

          {/* Take History */}
          {takes.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Take History</h2>
                {bestScore !== null && (
                  <span className="text-sm text-muted">
                    Best: <span className={`font-bold ${scoreColor(bestScore)}`}>{bestScore}%</span>
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {takes.map((take) => (
                  <div key={take.id} className="flex items-center justify-between bg-surface-light rounded-xl px-4 py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted">Take {take.number}</span>
                      <span className="text-xs text-muted">{take.duration}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${scoreColor(take.syncScore)}`}>{take.syncScore}%</span>
                      <button
                        onClick={() => handleLoopRecord(Math.random() * 15)}
                        className="text-xs bg-surface hover:bg-border px-2 py-1 rounded-lg transition-colors"
                      >
                        Loop
                      </button>
                      <button className="text-xs text-muted hover:text-foreground">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
