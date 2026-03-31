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

function getQualityGrade(events: DetectedEvent[]): { grade: string; color: string } {
  const rejects = events.filter((e) => e.severity === "reject").length;
  const significant = events.filter((e) => e.severity === "significant").length;
  if (rejects === 0 && significant <= 1) return { grade: "A", color: "text-success" };
  if (rejects <= 1 && significant <= 3) return { grade: "B", color: "text-accent-light" };
  if (rejects <= 2 && significant <= 5) return { grade: "C", color: "text-warning" };
  return { grade: "D", color: "text-danger" };
}

function classifySeverity(dbLevel: number, type: EventType): Severity {
  if (type === "plosive") {
    if (dbLevel >= -6) return "reject";
    if (dbLevel >= -12) return "significant";
    return "minor";
  }
  // breath
  if (dbLevel >= -20) return "reject";
  if (dbLevel >= -30) return "significant";
  return "minor";
}

export default function BreathDetectorPage() {
  const [mode, setMode] = useState<"upload" | "record">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const drawWaveformFromBuffer = useCallback((buffer: AudioBuffer, detectedEvents: DetectedEvent[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, w, h);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / w);

    // Draw event highlight regions first
    if (detectedEvents.length > 0) {
      const totalDuration = buffer.duration;
      for (const evt of detectedEvents) {
        const x = (evt.timestamp / totalDuration) * w;
        const eventWidth = Math.max(4, (evt.durationMs / 1000 / totalDuration) * w);
        const markerColor = evt.severity === "reject" ? "rgba(225, 112, 85, 0.25)" :
          evt.severity === "significant" ? "rgba(230, 126, 34, 0.2)" : "rgba(253, 203, 110, 0.15)";
        ctx.fillStyle = markerColor;
        ctx.fillRect(x, 0, eventWidth, h);
      }
    }

    // Draw waveform
    ctx.strokeStyle = "#6c5ce7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < w; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx < data.length) {
          if (data[idx] < min) min = data[idx];
          if (data[idx] > max) max = data[idx];
        }
      }
      const yMin = ((1 + min) / 2) * h;
      const yMax = ((1 + max) / 2) * h;
      ctx.moveTo(i, yMin);
      ctx.lineTo(i, yMax);
    }
    ctx.stroke();

    // Draw event markers on top
    if (detectedEvents.length > 0) {
      const totalDuration = buffer.duration;
      for (const evt of detectedEvents) {
        const x = (evt.timestamp / totalDuration) * w;
        const dotColor = evt.severity === "reject" ? "#e17055" : evt.severity === "significant" ? "#e67e22" : "#fdcb6e";
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, evt.type === "plosive" ? 10 : h - 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const analyzeAudio = useCallback(async (buffer: AudioBuffer) => {
    setIsAnalyzing(true);
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const detected: DetectedEvent[] = [];
    let eventCounter = 0;

    // Analysis parameters
    const windowSize = Math.floor(sampleRate * 0.02); // 20ms windows
    const hopSize = Math.floor(windowSize / 2);

    // Compute RMS per window and detect energy characteristics
    const windowCount = Math.floor((data.length - windowSize) / hopSize);
    const rmsValues: number[] = [];
    const peakValues: number[] = [];
    const zeroCrossings: number[] = [];

    for (let w = 0; w < windowCount; w++) {
      const start = w * hopSize;
      let sumSq = 0;
      let peak = 0;
      let zc = 0;
      for (let i = 0; i < windowSize; i++) {
        const idx = start + i;
        if (idx < data.length) {
          sumSq += data[idx] * data[idx];
          const abs = Math.abs(data[idx]);
          if (abs > peak) peak = abs;
          if (i > 0 && idx > 0) {
            if ((data[idx] >= 0 && data[idx - 1] < 0) || (data[idx] < 0 && data[idx - 1] >= 0)) {
              zc++;
            }
          }
        }
      }
      rmsValues.push(Math.sqrt(sumSq / windowSize));
      peakValues.push(peak);
      zeroCrossings.push(zc);
    }

    // Compute overall noise floor
    const sortedRms = [...rmsValues].filter((v) => v > 0).sort((a, b) => a - b);
    const noiseFloorLinear = sortedRms[Math.floor(sortedRms.length * 0.1)] || 0.001;

    // Detect breaths: energy above noise floor, low zero-crossing rate (below speech), sustained
    const breathMinWindows = 3;
    let breathStart = -1;
    let breathWindows = 0;

    for (let w = 0; w < windowCount; w++) {
      const rms = rmsValues[w];
      const zc = zeroCrossings[w];
      const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -96;
      const isBreathLike = rms > noiseFloorLinear * 2 && rms < noiseFloorLinear * 30 && zc < windowSize * 0.15;

      if (isBreathLike) {
        if (breathStart === -1) breathStart = w;
        breathWindows++;
      } else {
        if (breathWindows >= breathMinWindows) {
          const timestamp = (breathStart * hopSize) / sampleRate;
          const durationMs = Math.round((breathWindows * hopSize / sampleRate) * 1000);
          const maxRms = Math.max(...rmsValues.slice(breathStart, breathStart + breathWindows));
          const dbLevel = maxRms > 0 ? Math.round(20 * Math.log10(maxRms)) : -96;
          const severity = classifySeverity(dbLevel, "breath");
          detected.push({
            id: `e${eventCounter++}`,
            type: "breath",
            severity,
            timestamp: Math.round(timestamp * 100) / 100,
            durationMs,
            dbLevel,
          });
        }
        breathStart = -1;
        breathWindows = 0;
      }
    }

    // Detect plosives: sharp transients (large peak-to-RMS ratio, sudden energy jump)
    for (let w = 1; w < windowCount; w++) {
      const prevRms = rmsValues[w - 1];
      const currPeak = peakValues[w];
      const currRms = rmsValues[w];

      if (currRms <= 0) continue;
      const peakToRms = currPeak / currRms;
      const energyJump = prevRms > 0 ? currRms / prevRms : 0;
      const zc = zeroCrossings[w];

      // Plosive: high crest factor + sudden energy increase + moderate zero crossings
      if (peakToRms > 3 && energyJump > 4 && zc > windowSize * 0.05) {
        const timestamp = (w * hopSize) / sampleRate;
        const dbLevel = currPeak > 0 ? Math.round(20 * Math.log10(currPeak)) : -96;
        // Don't double-detect too close together
        const tooClose = detected.some((e) => e.type === "plosive" && Math.abs(e.timestamp - timestamp) < 0.15);
        if (!tooClose) {
          const severity = classifySeverity(dbLevel, "plosive");
          detected.push({
            id: `e${eventCounter++}`,
            type: "plosive",
            severity,
            timestamp: Math.round(timestamp * 100) / 100,
            durationMs: Math.round((hopSize / sampleRate) * 1000),
            dbLevel,
          });
        }
      }
    }

    // Sort by timestamp
    detected.sort((a, b) => a.timestamp - b.timestamp);

    setEvents(detected);
    setAnalysisComplete(true);
    setIsAnalyzing(false);
    drawWaveformFromBuffer(buffer, detected);
  }, [drawWaveformFromBuffer]);

  const decodeAndSet = useCallback(async (blob: Blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    try {
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
      drawWaveformFromBuffer(decoded, []);
      audioCtx.close();
    } catch {
      alert("Could not decode audio file.");
      audioCtx.close();
    }
  }, [drawWaveformFromBuffer]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAnalysisComplete(false);
      setEvents([]);
      await decodeAndSet(e.target.files[0]);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        streamRef.current = stream;
        chunksRef.current = [];
        setAnalysisComplete(false);
        setEvents([]);
        setAudioBuffer(null);

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          await decodeAndSet(blob);
        };
        mediaRecorderRef.current = recorder;
        recorder.start(100);
        setIsRecording(true);
      } catch {
        alert("Microphone access required.");
      }
    }
  };

  const handleAnalyze = () => {
    if (!audioBuffer) return;
    analyzeAudio(audioBuffer);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const totalPlosives = events.filter((e) => e.type === "plosive").length;
  const totalBreaths = events.filter((e) => e.type === "breath").length;
  const quality = getQualityGrade(events);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Breath & Plosive Detector</h1>
      <p className="text-muted mb-8">Analyze audio for breath intrusions and plosive impacts before delivery.</p>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("record")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === "record" ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:text-foreground"}`}
        >
          Record
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === "upload" ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:text-foreground"}`}
        >
          Upload Audio
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
              <span className="text-muted">Click to upload audio file (WAV, MP3, FLAC, WebM)</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <button
              onClick={handleRecord}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-colors ${
                isRecording ? "bg-danger animate-pulse" : "bg-accent hover:bg-accent-dark"
              } text-white`}
            >
              {isRecording ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
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
      {audioBuffer && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Waveform ({audioBuffer.duration.toFixed(1)}s)</h2>
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
              <span className="ml-2">Top dots = plosives, Bottom dots = breaths</span>
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
          {events.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Detected Events ({events.length})</h2>
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
                    <span className="text-sm font-mono">{evt.timestamp.toFixed(2)}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="bg-success/10 border border-success/20 rounded-2xl p-6 text-center">
              <div className="text-success text-lg font-semibold">Clean audio -- no issues detected</div>
              <p className="text-sm text-muted mt-1">No significant breath or plosive events found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
