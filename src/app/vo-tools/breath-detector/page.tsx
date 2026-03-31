"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Severity = "minor" | "significant" | "reject";
type EventType = "plosive" | "breath";

interface DetectedEvent {
  id: string;
  type: EventType;
  severity: Severity;
  timestamp: number;
  durationMs: number;
  dbLevel: number;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  minor: "bg-warning/15 text-warning border-warning/30",
  significant: "bg-[#e67e22]/15 text-[#e67e22] border-[#e67e22]/30",
  reject: "bg-danger/15 text-danger border-danger/30",
};

const SEVERITY_DOT: Record<Severity, string> = {
  minor: "bg-warning",
  significant: "bg-[#e67e22]",
  reject: "bg-danger",
};

const MOCK_EVENTS: DetectedEvent[] = [
  { id: "e1", type: "plosive", severity: "significant", timestamp: 1.24, durationMs: 45, dbLevel: -8 },
  { id: "e2", type: "breath", severity: "minor", timestamp: 3.67, durationMs: 320, dbLevel: -32 },
  { id: "e3", type: "plosive", severity: "reject", timestamp: 5.12, durationMs: 62, dbLevel: -4 },
  { id: "e4", type: "breath", severity: "significant", timestamp: 7.89, durationMs: 450, dbLevel: -24 },
  { id: "e5", type: "plosive", severity: "minor", timestamp: 10.33, durationMs: 28, dbLevel: -14 },
  { id: "e6", type: "breath", severity: "minor", timestamp: 12.55, durationMs: 280, dbLevel: -36 },
  { id: "e7", type: "plosive", severity: "significant", timestamp: 15.01, durationMs: 51, dbLevel: -6 },
  { id: "e8", type: "breath", severity: "reject", timestamp: 17.44, durationMs: 600, dbLevel: -18 },
];

function getQualityGrade(events: DetectedEvent[]): { grade: string; color: string } {
  const rejects = events.filter((e) => e.severity === "reject").length;
  const significant = events.filter((e) => e.severity === "significant").length;
  if (rejects === 0 && significant <= 1) return { grade: "A", color: "text-success" };
  if (rejects <= 1 && significant <= 3) return { grade: "B", color: "text-accent-light" };
  if (rejects <= 2 && significant <= 5) return { grade: "C", color: "text-warning" };
  return { grade: "D", color: "text-danger" };
}

export default function BreathDetectorPage() {
  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [isRecording, setIsRecording] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [loopFrom, setLoopFrom] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawWaveform = useCallback((withMarkers: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, w, h);

    // Draw mock waveform
    ctx.strokeStyle = "#6c5ce7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const t = x / w;
      const amplitude = (Math.sin(t * 40) * 0.3 + Math.sin(t * 120) * 0.15 + Math.sin(t * 200) * 0.05) * h * 0.4;
      const noise = (Math.random() - 0.5) * 8;
      const y = h / 2 + amplitude + noise;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw event markers
    if (withMarkers && events.length > 0) {
      const totalDuration = 20; // mock 20s
      events.forEach((evt) => {
        const x = (evt.timestamp / totalDuration) * w;
        const markerColor = evt.severity === "reject" ? "#e17055" : evt.severity === "significant" ? "#e67e22" : "#fdcb6e";
        ctx.fillStyle = markerColor + "40";
        ctx.fillRect(x - 4, 0, 8, h);
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.arc(x, 10, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [events]);

  useEffect(() => {
    if (hasAudio) drawWaveform(analysisComplete);
  }, [hasAudio, analysisComplete, drawWaveform]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setHasAudio(true);
      setAnalysisComplete(false);
      setEvents([]);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasAudio(true);
      setAnalysisComplete(false);
      setEvents([]);
    } else {
      setIsRecording(true);
      setHasAudio(false);
      setAnalysisComplete(false);
      setEvents([]);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate analysis delay
    setTimeout(() => {
      setEvents(MOCK_EVENTS);
      setAnalysisComplete(true);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleReRecord = (timestamp: number) => {
    setLoopFrom(timestamp);
    setIsRecording(true);
    setAnalysisComplete(false);
  };

  const totalPlosives = events.filter((e) => e.type === "plosive").length;
  const totalBreaths = events.filter((e) => e.type === "breath").length;
  const quality = getQualityGrade(events);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Breath & Plosive Detector</h1>
      <p className="text-muted mb-8">Flag plosive impacts and breath intrusions before delivery.</p>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("upload")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === "upload" ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:text-foreground"}`}
        >
          Upload Audio
        </button>
        <button
          onClick={() => setMode("record")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === "record" ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:text-foreground"}`}
        >
          Record
        </button>
      </div>

      {/* Input Area */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        {mode === "upload" ? (
          <div>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-accent/30 transition-colors"
            >
              <svg className="w-10 h-10 mx-auto text-muted mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-muted">Click to upload audio file (WAV, MP3, FLAC)</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            {loopFrom !== null && (
              <div className="text-sm text-warning mb-3">Re-recording from {loopFrom.toFixed(2)}s</div>
            )}
            <button
              onClick={handleRecord}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-colors ${
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
            <p className="text-sm text-muted mt-3">{isRecording ? "Recording... tap to stop" : "Tap to start recording"}</p>
          </div>
        )}
      </div>

      {/* Waveform */}
      {hasAudio && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Waveform</h2>
            {!analysisComplete && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Audio"}
              </button>
            )}
          </div>
          <canvas ref={canvasRef} width={800} height={160} className="w-full h-40 rounded-xl bg-surface-light" />
          {analysisComplete && (
            <div className="flex gap-4 mt-3 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Minor</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e67e22]" /> Significant</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" /> Reject</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {analysisComplete && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-warning">{totalPlosives}</div>
              <div className="text-sm text-muted">Plosives Found</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-accent-light">{totalBreaths}</div>
              <div className="text-sm text-muted">Breath Intrusions</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 text-center">
              <div className={`text-3xl font-bold ${quality.color}`}>{quality.grade}</div>
              <div className="text-sm text-muted">Quality Grade</div>
            </div>
          </div>

          {/* Event List */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Detected Events</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {events.map((evt) => (
                <div key={evt.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${SEVERITY_COLORS[evt.severity]}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${SEVERITY_DOT[evt.severity]}`} />
                    <div>
                      <span className="font-medium text-sm capitalize">{evt.type}</span>
                      <span className="text-xs opacity-70 ml-2">{evt.durationMs}ms @ {evt.dbLevel} dBFS</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono">{evt.timestamp.toFixed(2)}s</span>
                    <button
                      onClick={() => handleReRecord(evt.timestamp)}
                      className="text-xs bg-surface/50 hover:bg-surface px-2 py-1 rounded-lg transition-colors"
                      title="Re-record from this point"
                    >
                      Loop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
