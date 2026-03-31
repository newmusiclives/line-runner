"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Metrics {
  noiseFloor: number;
  peak: number;
  rms: number;
  clipping: boolean;
  clippingCount: number;
}

interface Recommendation {
  type: "success" | "warning" | "danger";
  message: string;
}

const STATUS_COLORS = {
  green: "text-success bg-success/15 border-success/30",
  amber: "text-warning bg-warning/15 border-warning/30",
  red: "text-danger bg-danger/15 border-danger/30",
};

const STATUS_DOT = {
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-danger",
};

export default function AudioMonitorPage() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    noiseFloor: -96,
    peak: -96,
    rms: -96,
    clipping: false,
    clippingCount: 0,
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [noiseFloorThreshold, setNoiseFloorThreshold] = useState(-50);
  const [clippingThreshold, setClippingThreshold] = useState(-3);
  const [isRecordingTest, setIsRecordingTest] = useState(false);
  const [testAnalysis, setTestAnalysis] = useState<{
    avgRms: number;
    peakDb: number;
    noiseFloor: number;
    duration: number;
    clippingEvents: number;
  } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const vuCanvasRef = useRef<HTMLCanvasElement>(null);
  const clippingCountRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const testChunksRef = useRef<Blob[]>([]);
  const testStartRef = useRef(0);
  const rmsHistoryRef = useRef<number[]>([]);
  const peakHistoryRef = useRef<number[]>([]);

  const drawVuMeter = useCallback((peakDb: number, rmsDb: number, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, w, h);

    const peakPercent = Math.max(0, Math.min(1, (peakDb + 60) / 60));
    const rmsPercent = Math.max(0, Math.min(1, (rmsDb + 60) / 60));

    // VU meter bars
    const barCount = 40;
    const barWidth = (w - (barCount - 1) * 2) / barCount;
    for (let i = 0; i < barCount; i++) {
      const threshold = i / barCount;
      const x = i * (barWidth + 2);
      const isActive = threshold <= rmsPercent;
      const isPeak = Math.abs(threshold - peakPercent) < 1 / barCount;

      if (isPeak) {
        ctx.fillStyle = "#ffffff";
      } else if (isActive) {
        if (threshold > 0.9) ctx.fillStyle = "#e17055";
        else if (threshold > 0.75) ctx.fillStyle = "#fdcb6e";
        else ctx.fillStyle = "#00b894";
      } else {
        if (threshold > 0.9) ctx.fillStyle = "rgba(225, 112, 85, 0.15)";
        else if (threshold > 0.75) ctx.fillStyle = "rgba(253, 203, 110, 0.15)";
        else ctx.fillStyle = "rgba(0, 184, 148, 0.15)";
      }
      ctx.fillRect(x, 4, barWidth, h - 8);
    }

    // dB scale
    ctx.fillStyle = "#6c6c8a";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    const dbMarks = [-60, -48, -36, -24, -12, -6, -3, 0];
    for (const db of dbMarks) {
      const xPos = ((db + 60) / 60) * w;
      ctx.fillText(`${db}`, xPos, h - 1);
    }
  }, []);

  const drawWaveform = useCallback((analyser: AnalyserNode) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const floatData = new Float32Array(analyser.fftSize);
    const freqData = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      analyser.getFloatTimeDomainData(floatData);
      analyser.getByteFrequencyData(freqData);

      // Compute metrics
      let peak = 0;
      let sumSquares = 0;
      for (let i = 0; i < floatData.length; i++) {
        const abs = Math.abs(floatData[i]);
        if (abs > peak) peak = abs;
        sumSquares += floatData[i] * floatData[i];
      }
      const rms = Math.sqrt(sumSquares / floatData.length);
      const peakDb = peak > 0 ? 20 * Math.log10(peak) : -96;
      const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -96;

      // Noise floor estimation: use lowest 10% of RMS rolling window
      rmsHistoryRef.current.push(rmsDb);
      if (rmsHistoryRef.current.length > 100) rmsHistoryRef.current.shift();
      const sorted = [...rmsHistoryRef.current].sort((a, b) => a - b);
      const noiseFloorEstimate = sorted[Math.floor(sorted.length * 0.1)] || -96;

      peakHistoryRef.current.push(peakDb);
      if (peakHistoryRef.current.length > 50) peakHistoryRef.current.shift();

      const isClipping = peakDb >= clippingThreshold;
      if (isClipping) clippingCountRef.current++;

      setMetrics({
        noiseFloor: Math.round(noiseFloorEstimate),
        peak: Math.round(peakDb * 10) / 10,
        rms: Math.round(rmsDb * 10) / 10,
        clipping: isClipping,
        clippingCount: clippingCountRef.current,
      });

      // Build recommendations
      const recs: Recommendation[] = [];
      if (rmsDb < -40 && rmsDb > -90) {
        recs.push({ type: "warning", message: "Too quiet -- move closer to the mic or increase gain" });
      }
      if (rmsDb >= -40 && rmsDb <= -12) {
        recs.push({ type: "success", message: "Good level -- sitting in the broadcast sweet spot" });
      }
      if (isClipping) {
        recs.push({ type: "danger", message: "Clipping detected -- back off the mic or reduce gain" });
      }
      if (noiseFloorEstimate > noiseFloorThreshold) {
        recs.push({ type: "warning", message: "Background noise high -- check room treatment or reduce fan/AC" });
      }
      if (noiseFloorEstimate <= noiseFloorThreshold && !isClipping && rmsDb >= -40) {
        recs.push({ type: "success", message: "Noise floor looks clean" });
      }
      setRecommendations(recs);

      // Draw waveform
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "#2d2d3f";
      ctx.lineWidth = 1;
      for (let y = 0; y <= h; y += h / 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = "#3d3d5f";
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = isClipping ? "#e17055" : peakDb >= -12 ? "#fdcb6e" : "#00b894";
      ctx.beginPath();
      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // RMS envelope lines
      ctx.strokeStyle = "rgba(162, 155, 254, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const rmsHeight = Math.min(h / 2, rms * h * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - rmsHeight);
      ctx.lineTo(w, h / 2 - rmsHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, h / 2 + rmsHeight);
      ctx.lineTo(w, h / 2 + rmsHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw spectrum analyzer
      const specCanvas = spectrumCanvasRef.current;
      if (specCanvas) {
        const sctx = specCanvas.getContext("2d");
        if (sctx) {
          const sw = specCanvas.width;
          const sh = specCanvas.height;
          sctx.fillStyle = "#1a1a24";
          sctx.fillRect(0, 0, sw, sh);

          // Grid
          sctx.strokeStyle = "#2d2d3f";
          sctx.lineWidth = 1;
          for (let y = 0; y < sh; y += sh / 4) {
            sctx.beginPath();
            sctx.moveTo(0, y);
            sctx.lineTo(sw, y);
            sctx.stroke();
          }

          const barCountSpec = Math.min(bufferLength, 128);
          const barWidthSpec = sw / barCountSpec;
          for (let i = 0; i < barCountSpec; i++) {
            const value = freqData[i] / 255;
            const barHeight = value * sh;
            const hue = (1 - value) * 120; // green to red
            sctx.fillStyle = `hsla(${hue}, 80%, 55%, 0.85)`;
            sctx.fillRect(i * barWidthSpec, sh - barHeight, barWidthSpec - 1, barHeight);
          }

          // Frequency labels
          sctx.fillStyle = "#6c6c8a";
          sctx.font = "10px monospace";
          sctx.textAlign = "center";
          const sampleRate = analyser.context.sampleRate;
          const freqLabels = [100, 500, 1000, 5000, 10000, 20000];
          for (const freq of freqLabels) {
            const bin = Math.round((freq / (sampleRate / 2)) * bufferLength);
            if (bin < barCountSpec) {
              const lx = (bin / barCountSpec) * sw;
              sctx.fillText(freq >= 1000 ? `${freq / 1000}k` : `${freq}`, lx, sh - 2);
            }
          }
        }
      }

      // Draw VU meter
      const vuCanvas = vuCanvasRef.current;
      if (vuCanvas) {
        drawVuMeter(peakDb, rmsDb, vuCanvas);
      }
    };

    draw();
  }, [clippingThreshold, noiseFloorThreshold, drawVuMeter]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      clippingCountRef.current = 0;
      rmsHistoryRef.current = [];
      peakHistoryRef.current = [];
      setIsMonitoring(true);
      drawWaveform(analyser);
    } catch {
      alert("Microphone access is required for audio monitoring.");
    }
  };

  const stopMonitoring = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setIsMonitoring(false);
  };

  const startTestRecording = async () => {
    if (!streamRef.current || !isMonitoring) {
      alert("Start monitoring first before recording a test sample.");
      return;
    }
    testChunksRef.current = [];
    testStartRef.current = Date.now();
    rmsHistoryRef.current = [];
    peakHistoryRef.current = [];

    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) testChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const duration = (Date.now() - testStartRef.current) / 1000;
      const sortedRms = [...rmsHistoryRef.current].sort((a, b) => a - b);
      const avgRms = rmsHistoryRef.current.length > 0
        ? rmsHistoryRef.current.reduce((a, b) => a + b, 0) / rmsHistoryRef.current.length
        : -96;
      const peakMax = peakHistoryRef.current.length > 0
        ? Math.max(...peakHistoryRef.current)
        : -96;
      const noiseFloor = sortedRms[Math.floor(sortedRms.length * 0.1)] || -96;

      setTestAnalysis({
        avgRms: Math.round(avgRms * 10) / 10,
        peakDb: Math.round(peakMax * 10) / 10,
        noiseFloor: Math.round(noiseFloor),
        duration: Math.round(duration * 10) / 10,
        clippingEvents: clippingCountRef.current,
      });
    };
    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setIsRecordingTest(true);
    setTestAnalysis(null);
  };

  const stopTestRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingTest(false);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const noiseStatus: "green" | "amber" | "red" = metrics.noiseFloor <= noiseFloorThreshold ? "green" : metrics.noiseFloor <= noiseFloorThreshold + 10 ? "amber" : "red";
  const clippingStatus: "green" | "amber" | "red" = metrics.clippingCount === 0 ? "green" : metrics.clippingCount < 5 ? "amber" : "red";
  const levelStatus: "green" | "amber" | "red" = metrics.rms >= -40 && metrics.rms <= -12 ? "green" : metrics.rms > -12 ? "red" : "amber";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Audio Quality Monitor</h1>
      <p className="text-muted mb-8">Real-time monitoring of volume levels, noise floor, clipping, and frequency spectrum.</p>

      {/* VU Meter */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">VU Meter</h2>
          <span className="font-mono text-sm text-muted">
            {isMonitoring ? `Peak: ${metrics.peak.toFixed(1)} dBFS | RMS: ${metrics.rms.toFixed(1)} dBFS` : "-- dBFS"}
          </span>
        </div>
        <canvas ref={vuCanvasRef} width={800} height={48} className="w-full h-12 rounded-lg bg-surface-light" />
      </div>

      {/* Waveform */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Waveform</h2>
          <div className="flex items-center gap-3">
            {isMonitoring && (
              <span className="flex items-center gap-2 text-sm text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Live
              </span>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className="text-sm text-muted hover:text-foreground transition-colors">
              Settings
            </button>
          </div>
        </div>
        <canvas ref={waveformCanvasRef} width={800} height={200} className="w-full h-48 rounded-xl bg-surface-light" />
      </div>

      {/* Spectrum Analyzer */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-3">Spectrum Analyzer</h2>
        <canvas ref={spectrumCanvasRef} width={800} height={150} className="w-full h-36 rounded-xl bg-surface-light" />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        {!isMonitoring ? (
          <button onClick={startMonitoring} className="bg-accent hover:bg-accent-dark text-white font-semibold px-10 py-3.5 rounded-xl transition-colors text-lg">
            Start Monitoring
          </button>
        ) : (
          <>
            <button onClick={stopMonitoring} className="bg-danger hover:bg-danger/80 text-white font-semibold px-10 py-3.5 rounded-xl transition-colors text-lg">
              Stop Monitoring
            </button>
            {!isRecordingTest ? (
              <button onClick={startTestRecording} className="bg-warning hover:bg-warning/80 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
                Record Test Sample
              </button>
            ) : (
              <button onClick={stopTestRecording} className="bg-danger animate-pulse text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
                Stop Test Recording
              </button>
            )}
          </>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className={`border rounded-xl p-4 ${STATUS_COLORS[noiseStatus]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[noiseStatus]}`} />
            <span className="text-sm font-medium">Noise Floor</span>
          </div>
          <div className="text-2xl font-bold mb-1">{isMonitoring ? `${metrics.noiseFloor} dBFS` : "--"}</div>
          <div className="text-xs opacity-70">Target: &lt; {noiseFloorThreshold} dBFS</div>
        </div>
        <div className={`border rounded-xl p-4 ${STATUS_COLORS[clippingStatus]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[clippingStatus]}`} />
            <span className="text-sm font-medium">Clipping</span>
          </div>
          <div className="text-2xl font-bold mb-1">{isMonitoring ? `${metrics.clippingCount} events` : "--"}</div>
          <div className="text-xs opacity-70">Threshold: {clippingThreshold} dBFS</div>
        </div>
        <div className={`border rounded-xl p-4 ${STATUS_COLORS[levelStatus]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[levelStatus]}`} />
            <span className="text-sm font-medium">Level</span>
          </div>
          <div className="text-2xl font-bold mb-1">{isMonitoring ? `${metrics.rms.toFixed(1)} dBFS` : "--"}</div>
          <div className="text-xs opacity-70">Sweet spot: -40 to -12 dBFS</div>
        </div>
      </div>

      {/* Recommendations */}
      {isMonitoring && recommendations.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-3">Recommendations</h2>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  rec.type === "success" ? "bg-success/10 border-success/20 text-success" :
                  rec.type === "warning" ? "bg-warning/10 border-warning/20 text-warning" :
                  "bg-danger/10 border-danger/20 text-danger"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {rec.type === "success" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  )}
                </svg>
                <span className="text-sm font-medium">{rec.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Sample Analysis */}
      {testAnalysis && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Test Sample Analysis</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-accent-light">{testAnalysis.duration}s</div>
              <div className="text-xs text-muted mt-1">Duration</div>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-accent-light">{testAnalysis.avgRms} dB</div>
              <div className="text-xs text-muted mt-1">Avg RMS</div>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${testAnalysis.peakDb >= -3 ? "text-danger" : "text-success"}`}>{testAnalysis.peakDb} dB</div>
              <div className="text-xs text-muted mt-1">Peak</div>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${testAnalysis.noiseFloor > noiseFloorThreshold ? "text-warning" : "text-success"}`}>{testAnalysis.noiseFloor} dB</div>
              <div className="text-xs text-muted mt-1">Noise Floor</div>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${testAnalysis.clippingEvents > 0 ? "text-danger" : "text-success"}`}>{testAnalysis.clippingEvents}</div>
              <div className="text-xs text-muted mt-1">Clips</div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Threshold Settings</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted block mb-1.5">Noise Floor Threshold (dBFS)</label>
              <input
                type="number"
                value={noiseFloorThreshold}
                onChange={(e) => setNoiseFloorThreshold(parseFloat(e.target.value) || -50)}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                min={-80} max={-20} step={1}
              />
              <span className="text-xs text-muted mt-1 block">Default: -50 dBFS. Lower = stricter.</span>
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Clipping Threshold (dBFS)</label>
              <input
                type="number"
                value={clippingThreshold}
                onChange={(e) => setClippingThreshold(parseFloat(e.target.value) || -3)}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                min={-12} max={0} step={0.5}
              />
              <span className="text-xs text-muted mt-1 block">Default: -3 dBFS. Peaks above this flag red.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
