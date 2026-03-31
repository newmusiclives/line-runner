"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Take {
  id: string;
  number: number;
  syncScore: number;
  timestamp: string;
  durationSec: number;
  timingOffset: number;
  blob: Blob | null;
  playbackUrl: string | null;
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
  const [referenceBuffer, setReferenceBuffer] = useState<AudioBuffer | null>(null);
  const [referenceFileName, setReferenceFileName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [takes, setTakes] = useState<Take[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [savedToDb, setSavedToDb] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const refCanvasRef = useRef<HTMLCanvasElement>(null);
  const recCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const refSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const drawWaveform = useCallback((canvas: HTMLCanvasElement, buffer: AudioBuffer, color: string) => {
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

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / w);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
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

    // Duration label
    ctx.fillStyle = "#6c6c8a";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${buffer.duration.toFixed(2)}s`, w - 8, h - 8);
  }, []);

  const computeSyncScore = useCallback((refBuffer: AudioBuffer, takeBuffer: AudioBuffer): { score: number; timingOffset: number } => {
    const refDuration = refBuffer.duration;
    const takeDuration = takeBuffer.duration;
    const durationDiff = Math.abs(refDuration - takeDuration);
    const durationScore = Math.max(0, 100 - (durationDiff / refDuration) * 200);

    // Cross-correlate envelopes to find timing offset
    const refData = refBuffer.getChannelData(0);
    const takeData = takeBuffer.getChannelData(0);
    const windowSize = 512;

    const getEnvelope = (data: Float32Array): number[] => {
      const env: number[] = [];
      for (let i = 0; i < data.length; i += windowSize) {
        let sum = 0;
        const end = Math.min(i + windowSize, data.length);
        for (let j = i; j < end; j++) sum += data[j] * data[j];
        env.push(Math.sqrt(sum / (end - i)));
      }
      return env;
    };

    const refEnv = getEnvelope(refData);
    const takeEnv = getEnvelope(takeData);
    const minLen = Math.min(refEnv.length, takeEnv.length);

    // Simple correlation at zero lag
    let dotProduct = 0;
    let refNorm = 0;
    let takeNorm = 0;
    for (let i = 0; i < minLen; i++) {
      dotProduct += refEnv[i] * takeEnv[i];
      refNorm += refEnv[i] * refEnv[i];
      takeNorm += takeEnv[i] * takeEnv[i];
    }
    const correlation = refNorm > 0 && takeNorm > 0
      ? dotProduct / (Math.sqrt(refNorm) * Math.sqrt(takeNorm))
      : 0;
    const correlationScore = correlation * 100;

    const timingOffset = Math.round((takeDuration - refDuration) * 1000) / 1000;
    const score = Math.round(Math.min(100, (durationScore * 0.4 + correlationScore * 0.6)));

    return { score, timingOffset };
  }, []);

  const handleUploadReference = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setReferenceFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const ctx = new AudioContext();
    try {
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setReferenceBuffer(decoded);
      if (refCanvasRef.current) drawWaveform(refCanvasRef.current, decoded, "#a29bfe");
    } catch {
      alert("Could not decode reference audio.");
    }
    ctx.close();
  };

  const playReference = () => {
    if (!referenceBuffer) return;
    if (isPlayingRef && refSourceRef.current) {
      refSourceRef.current.stop();
      setIsPlayingRef(false);
      return;
    }
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createBufferSource();
    source.buffer = referenceBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlayingRef(false);
    refSourceRef.current = source;
    source.start();
    setIsPlayingRef(true);
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
        recordStartRef.current = Date.now();

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const durationSec = (Date.now() - recordStartRef.current) / 1000;

          // Decode to buffer for analysis
          const arrayBuffer = await blob.arrayBuffer();
          const ctx = new AudioContext();
          let takeBuffer: AudioBuffer | null = null;
          try {
            takeBuffer = await ctx.decodeAudioData(arrayBuffer);
          } catch { /* decode failed */ }
          ctx.close();

          let syncScore = 0;
          let timingOffset = 0;
          if (referenceBuffer && takeBuffer) {
            const result = computeSyncScore(referenceBuffer, takeBuffer);
            syncScore = result.score;
            timingOffset = result.timingOffset;
            if (recCanvasRef.current) drawWaveform(recCanvasRef.current, takeBuffer, "#00b894");
          }

          setCurrentScore(syncScore);
          const playbackUrl = URL.createObjectURL(blob);
          const newTake: Take = {
            id: `t-${Date.now()}`,
            number: takes.length + 1,
            syncScore,
            timestamp: new Date().toLocaleTimeString(),
            durationSec: Math.round(durationSec * 10) / 10,
            timingOffset,
            blob,
            playbackUrl,
          };
          setTakes((prev) => [newTake, ...prev]);
        };
        mediaRecorderRef.current = recorder;
        recorder.start(100);
        setIsRecording(true);
        setCurrentScore(null);
      } catch {
        alert("Microphone access required.");
      }
    }
  };

  const playTake = (take: Take) => {
    if (!take.playbackUrl) return;
    const audio = new Audio(take.playbackUrl);
    audio.play();
  };

  const saveSession = async () => {
    if (!sessionTitle.trim()) return;
    const takesForDb = takes.map((t) => ({
      number: t.number,
      syncScore: t.syncScore,
      timestamp: t.timestamp,
      durationSec: t.durationSec,
      timingOffset: t.timingOffset,
    }));
    const bestScore = takes.length > 0 ? Math.max(...takes.map((t) => t.syncScore)) : 0;

    try {
      if (sessionId) {
        await fetch("/api/vo-tools/adr", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sessionId, takes: takesForDb, best_score: bestScore }),
        });
      } else {
        const res = await fetch("/api/vo-tools/adr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sessionTitle, takes: takesForDb, best_score: bestScore }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.id);
        }
      }
      setSavedToDb(true);
      setTimeout(() => setSavedToDb(false), 2000);
    } catch {
      alert("Failed to save session.");
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      takes.forEach((t) => { if (t.playbackUrl) URL.revokeObjectURL(t.playbackUrl); });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bestScore = takes.length > 0 ? Math.max(...takes.map((t) => t.syncScore)) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">ADR & Dubbing Mode</h1>
      <p className="text-muted mb-8">Upload reference audio, record sync attempts, and score your timing accuracy.</p>

      {/* Upload Reference */}
      {!referenceBuffer ? (
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
            <span className="text-xs text-muted">WAV, MP3, MP4, WebM</span>
          </button>
        </div>
      ) : (
        <>
          {/* Reference Info */}
          <div className="flex items-center gap-3 mb-4 text-sm text-muted">
            <svg className="w-4 h-4 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Reference: {referenceFileName} ({referenceBuffer.duration.toFixed(1)}s)
            <button onClick={() => { setReferenceBuffer(null); setReferenceFileName(""); setTakes([]); }} className="text-xs text-danger hover:text-danger/80 ml-auto">
              Remove
            </button>
          </div>

          {/* Session Title */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session title (for saving)"
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <button
              onClick={saveSession}
              disabled={!sessionTitle.trim() || takes.length === 0}
              className="bg-success/15 text-success hover:bg-success/25 font-medium px-5 py-2 rounded-lg text-sm transition-colors border border-success/30 disabled:opacity-40"
            >
              {savedToDb ? "Saved" : "Save Session"}
            </button>
          </div>

          {/* Side-by-Side Waveforms */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-accent-light">Reference</h3>
                <button onClick={playReference} className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  {isPlayingRef ? "Stop" : "Play"}
                </button>
              </div>
              <canvas ref={refCanvasRef} width={400} height={120} className="w-full h-28 rounded-lg bg-surface-light" />
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-success">Your Recording</h3>
                {takes.length > 0 && (
                  <button onClick={() => playTake(takes[0])} className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    Play Latest
                  </button>
                )}
              </div>
              <canvas ref={recCanvasRef} width={400} height={120} className="w-full h-28 rounded-lg bg-surface-light" />
            </div>
          </div>

          {/* Record Controls */}
          <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleRecord}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
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
              <span className="text-sm text-muted">{isRecording ? "Recording take..." : "Record new take"}</span>
            </div>

            {currentScore !== null && (
              <div className={`mt-6 border rounded-xl p-6 text-center ${scoreBg(currentScore)}`}>
                <div className="text-sm text-muted mb-1">Sync Score</div>
                <div className={`text-5xl font-bold ${scoreColor(currentScore)}`}>{currentScore}%</div>
                <div className="text-xs text-muted mt-2">
                  {takes[0] && (
                    <span>Duration: {takes[0].durationSec}s | Offset: {takes[0].timingOffset > 0 ? "+" : ""}{takes[0].timingOffset}s</span>
                  )}
                </div>
                <div className="text-xs text-muted mt-1">
                  {currentScore >= 90 ? "Excellent sync!" : currentScore >= 75 ? "Good -- minor timing drift" : "Needs work -- try matching the reference more closely"}
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
                      <span className="text-xs text-muted">{take.durationSec}s</span>
                      <span className="text-xs text-muted">Offset: {take.timingOffset > 0 ? "+" : ""}{take.timingOffset}s</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${scoreColor(take.syncScore)}`}>{take.syncScore}%</span>
                      <button onClick={() => playTake(take)} className="text-xs text-muted hover:text-foreground">
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
