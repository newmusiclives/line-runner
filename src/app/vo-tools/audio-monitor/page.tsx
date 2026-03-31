"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Thresholds {
  noiseFloor: number;
  clipping: number;
}

interface Metrics {
  noiseFloor: number;
  peak: number;
  rms: number;
  proximityEffect: number;
  roomTone: number;
}

function getStatus(value: number, greenMax: number, amberMax: number): "green" | "amber" | "red" {
  if (value <= greenMax) return "green";
  if (value <= amberMax) return "amber";
  return "red";
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
  const [thresholds, setThresholds] = useState<Thresholds>({ noiseFloor: -50, clipping: -3 });
  const [metrics, setMetrics] = useState<Metrics>({ noiseFloor: -60, peak: -18, rms: -24, proximityEffect: 0.2, roomTone: 0.1 });
  const [levelDb, setLevelDb] = useState(-60);
  const [showSettings, setShowSettings] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWaveform = useCallback((analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const floatData = new Float32Array(analyser.fftSize);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      analyser.getFloatTimeDomainData(floatData);

      // Calculate metrics
      let peak = 0;
      let sumSquares = 0;
      let lowFreqEnergy = 0;
      for (let i = 0; i < floatData.length; i++) {
        const abs = Math.abs(floatData[i]);
        if (abs > peak) peak = abs;
        sumSquares += floatData[i] * floatData[i];
        if (i < floatData.length * 0.1) lowFreqEnergy += abs;
      }
      const rms = Math.sqrt(sumSquares / floatData.length);
      const peakDb = peak > 0 ? 20 * Math.log10(peak) : -96;
      const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -96;
      const noiseFloorDb = rmsDb - 6; // simplified estimation
      const proximity = Math.min(1, lowFreqEnergy / (floatData.length * 0.1) * 5);
      const roomTone = Math.max(0, Math.min(1, (rmsDb + 60) / 30));

      setLevelDb(peakDb);
      setMetrics({
        noiseFloor: Math.round(noiseFloorDb),
        peak: Math.round(peakDb * 10) / 10,
        rms: Math.round(rmsDb * 10) / 10,
        proximityEffect: Math.round(proximity * 100) / 100,
        roomTone: Math.round(roomTone * 100) / 100,
      });

      // Draw waveform
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "#2d2d3f";
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += h / 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Waveform
      const isClipping = peakDb >= -3;
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

      // RMS overlay
      ctx.strokeStyle = "rgba(162, 155, 254, 0.4)";
      ctx.lineWidth = 1;
      const rmsHeight = Math.min(h / 2, (rms * h) / 2);
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - rmsHeight);
      ctx.lineTo(w, h / 2 - rmsHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, h / 2 + rmsHeight);
      ctx.lineTo(w, h / 2 + rmsHeight);
      ctx.stroke();
    };

    draw();
  }, []);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
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
    setIsMonitoring(false);
    setLevelDb(-60);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const noiseStatus = metrics.noiseFloor <= thresholds.noiseFloor ? "green" : metrics.noiseFloor <= thresholds.noiseFloor + 10 ? "amber" : "red";
  const clippingStatus = metrics.peak <= thresholds.clipping - 6 ? "green" : metrics.peak <= thresholds.clipping ? "amber" : "red";
  const proximityStatus = getStatus(metrics.proximityEffect, 0.3, 0.6);
  const roomToneStatus = getStatus(metrics.roomTone, 0.2, 0.5);

  const levelPercent = Math.max(0, Math.min(100, ((levelDb + 60) / 60) * 100));
  const levelColor = levelDb >= -3 ? "bg-danger" : levelDb >= -12 ? "bg-warning" : "bg-success";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Audio Quality Monitor</h1>
      <p className="text-muted mb-8">Real-time monitoring of noise floor, clipping, proximity effect, and room tone.</p>

      {/* Waveform Display */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Waveform</h2>
          <div className="flex items-center gap-3">
            {isMonitoring && (
              <span className="flex items-center gap-2 text-sm text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Live
              </span>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-48 rounded-xl bg-surface-light"
        />

        {/* Level Meter */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Level</span>
            <span className="font-mono">{isMonitoring ? `${levelDb.toFixed(1)} dBFS` : "-- dBFS"}</span>
          </div>
          <div className="h-3 bg-surface-light rounded-full overflow-hidden">
            <div
              className={`h-full ${levelColor} transition-all duration-75 rounded-full`}
              style={{ width: `${isMonitoring ? levelPercent : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>-60</span>
            <span>-48</span>
            <span>-36</span>
            <span>-24</span>
            <span>-12</span>
            <span className="text-danger">0</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center mb-6">
        {!isMonitoring ? (
          <button
            onClick={startMonitoring}
            className="bg-accent hover:bg-accent-dark text-white font-semibold px-10 py-3.5 rounded-xl transition-colors text-lg"
          >
            Start Monitoring
          </button>
        ) : (
          <button
            onClick={stopMonitoring}
            className="bg-danger hover:bg-danger/80 text-white font-semibold px-10 py-3.5 rounded-xl transition-colors text-lg"
          >
            Stop Monitoring
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {([
          { label: "Noise Floor", value: `${metrics.noiseFloor} dBFS`, status: noiseStatus as keyof typeof STATUS_COLORS, target: `Target: < ${thresholds.noiseFloor} dBFS` },
          { label: "Clipping", value: `${metrics.peak} dBFS peak`, status: clippingStatus as keyof typeof STATUS_COLORS, target: `Threshold: ${thresholds.clipping} dBFS` },
          { label: "Proximity Effect", value: `${(metrics.proximityEffect * 100).toFixed(0)}%`, status: proximityStatus as keyof typeof STATUS_COLORS, target: "Low-end buildup" },
          { label: "Room Tone", value: `${(metrics.roomTone * 100).toFixed(0)}%`, status: roomToneStatus as keyof typeof STATUS_COLORS, target: "Ambient noise level" },
        ]).map((m) => (
          <div key={m.label} className={`border rounded-xl p-4 ${STATUS_COLORS[m.status]}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[m.status]}`} />
              <span className="text-sm font-medium">{m.label}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{m.value}</div>
            <div className="text-xs opacity-70">{m.target}</div>
          </div>
        ))}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Threshold Settings</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted block mb-1.5">Noise Floor Threshold (dBFS)</label>
              <input
                type="number"
                value={thresholds.noiseFloor}
                onChange={(e) => setThresholds((t) => ({ ...t, noiseFloor: parseFloat(e.target.value) || -50 }))}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                min={-80}
                max={-20}
                step={1}
              />
              <span className="text-xs text-muted mt-1 block">Default: -50 dBFS. Lower = stricter.</span>
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Clipping Threshold (dBFS)</label>
              <input
                type="number"
                value={thresholds.clipping}
                onChange={(e) => setThresholds((t) => ({ ...t, clipping: parseFloat(e.target.value) || -3 }))}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                min={-12}
                max={0}
                step={0.5}
              />
              <span className="text-xs text-muted mt-1 block">Default: -3 dBFS. Peaks above this flag red.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
