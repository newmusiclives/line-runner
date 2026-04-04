"use client";

import { useState, useRef, useEffect, useCallback } from "react";

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const data = buffer.getChannelData(0);
  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, bufferLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default function WaveformEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [prevBuffer, setPrevBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackStart, setPlaybackStart] = useState(0);
  const [playbackOffset, setPlaybackOffset] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [peakLevel, setPeakLevel] = useState(0);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  // Calculate peak level when buffer changes
  useEffect(() => {
    if (!audioBuffer) {
      setPeakLevel(0);
      return;
    }
    const data = audioBuffer.getChannelData(0);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    setPeakLevel(max);
  }, [audioBuffer]);

  // Draw waveform
  const drawWaveform = useCallback(
    (currentCursor?: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !audioBuffer) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const data = audioBuffer.getChannelData(0);
      const samplesPerPixel = data.length / w;
      const mid = h / 2;

      // Background
      ctx.fillStyle = "#0d0f12";
      ctx.fillRect(0, 0, w, h);

      // Selection highlight
      if (selectionStart !== null && selectionEnd !== null) {
        const s = Math.min(selectionStart, selectionEnd);
        const e = Math.max(selectionStart, selectionEnd);
        const sx = (s / data.length) * w;
        const ex = (e / data.length) * w;
        ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
        ctx.fillRect(sx, 0, ex - sx, h);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
        ctx.moveTo(ex, 0);
        ctx.lineTo(ex, h);
        ctx.stroke();
      }

      // Waveform
      ctx.fillStyle = "#6366f1";
      for (let x = 0; x < w; x++) {
        const start = Math.floor(x * samplesPerPixel);
        const end = Math.floor((x + 1) * samplesPerPixel);
        let min = 1;
        let max = -1;
        for (let i = start; i < end && i < data.length; i++) {
          if (data[i] < min) min = data[i];
          if (data[i] > max) max = data[i];
        }
        const top = mid - max * mid;
        const bottom = mid - min * mid;
        ctx.fillRect(x, top, 1, Math.max(1, bottom - top));
      }

      // Center line
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();

      // Time axis
      const duration = audioBuffer.duration;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const interval = duration <= 5 ? 1 : duration <= 30 ? 5 : duration <= 120 ? 10 : 30;
      for (let t = 0; t <= duration; t += interval) {
        const x = (t / duration) * w;
        ctx.fillText(formatTime(t), x, h - 4);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 16);
        ctx.stroke();
      }

      // Playback cursor
      const cursor = currentCursor ?? cursorPos;
      if (cursor > 0) {
        const cx = (cursor / duration) * w;
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();
      }
    },
    [audioBuffer, selectionStart, selectionEnd, cursorPos]
  );

  // Redraw on changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => drawWaveform());
    observer.observe(container);
    return () => observer.disconnect();
  }, [drawWaveform]);

  // Playback animation
  useEffect(() => {
    if (!isPlaying) return;
    const tick = () => {
      const ctx = getAudioContext();
      const elapsed = ctx.currentTime - playbackStart;
      const pos = playbackOffset + elapsed;
      if (audioBuffer && pos <= audioBuffer.duration) {
        setCursorPos(pos);
        drawWaveform(pos);
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, playbackStart, playbackOffset, audioBuffer, drawWaveform, getAudioContext]);

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1);
    return `${m}:${sec.padStart(4, "0")}`;
  }

  // Load audio file
  const loadAudio = async (file: File) => {
    const ctx = getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
    setPrevBuffer(null);
    setFileName(file.name);
    setSelectionStart(null);
    setSelectionEnd(null);
    setCursorPos(0);
    stopPlayback();
  };

  // Record from microphone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
        const ctx = getAudioContext();
        const arrayBuffer = await blob.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        setAudioBuffer(decoded);
        setPrevBuffer(null);
        setFileName("recording.webm");
        setSelectionStart(null);
        setSelectionEnd(null);
        setCursorPos(0);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  // Playback
  const play = (fromPos?: number) => {
    if (!audioBuffer) return;
    stopPlayback();
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.loop = false;

    let startAt = fromPos ?? cursorPos;
    let duration: number | undefined;

    if (isLooping && selectionStart !== null && selectionEnd !== null) {
      const s = Math.min(selectionStart, selectionEnd) / audioBuffer.sampleRate;
      const e = Math.max(selectionStart, selectionEnd) / audioBuffer.sampleRate;
      startAt = s;
      duration = e - s;
      source.loop = true;
      source.loopStart = s;
      source.loopEnd = e;
    }

    source.start(0, startAt, isLooping ? undefined : duration);
    source.onended = () => setIsPlaying(false);
    sourceRef.current = source;
    setPlaybackStart(ctx.currentTime);
    setPlaybackOffset(startAt);
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    try {
      sourceRef.current?.stop();
    } catch {
      // already stopped
    }
    sourceRef.current = null;
    setIsPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
  };

  const pause = () => {
    if (!isPlaying) return;
    const ctx = getAudioContext();
    const elapsed = ctx.currentTime - playbackStart;
    const pos = playbackOffset + elapsed;
    stopPlayback();
    setCursorPos(pos);
  };

  // Canvas mouse handlers for selection
  const canvasToSample = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return Math.floor((x / rect.width) * audioBuffer.getChannelData(0).length);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const sample = canvasToSample(e.clientX);
    setSelectionStart(sample);
    setSelectionEnd(sample);
    setIsDragging(true);
    if (audioBuffer) {
      setCursorPos(sample / audioBuffer.sampleRate);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setSelectionEnd(canvasToSample(e.clientX));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (selectionStart !== null && selectionEnd !== null && selectionStart === selectionEnd) {
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  // Save undo state and apply edit
  const applyEdit = (newBuffer: AudioBuffer) => {
    setPrevBuffer(audioBuffer);
    setAudioBuffer(newBuffer);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const createBufferFromData = (data: Float32Array, sampleRate: number): AudioBuffer => {
    const ctx = getAudioContext();
    const newBuf = ctx.createBuffer(1, data.length, sampleRate);
    newBuf.copyToChannel(new Float32Array(data) as unknown as Float32Array<ArrayBuffer>, 0);
    return newBuf;
  };

  // Edit operations
  const trimSelection = () => {
    if (!audioBuffer || selectionStart === null || selectionEnd === null) return;
    const s = Math.min(selectionStart, selectionEnd);
    const e = Math.max(selectionStart, selectionEnd);
    const data = audioBuffer.getChannelData(0);
    const trimmed = data.slice(s, e);
    applyEdit(createBufferFromData(trimmed, audioBuffer.sampleRate));
  };

  const fadeIn = () => {
    if (!audioBuffer || selectionStart === null || selectionEnd === null) return;
    const s = Math.min(selectionStart, selectionEnd);
    const e = Math.max(selectionStart, selectionEnd);
    const data = new Float32Array(audioBuffer.getChannelData(0));
    const len = e - s;
    for (let i = 0; i < len; i++) {
      data[s + i] *= i / len;
    }
    applyEdit(createBufferFromData(data, audioBuffer.sampleRate));
  };

  const fadeOut = () => {
    if (!audioBuffer || selectionStart === null || selectionEnd === null) return;
    const s = Math.min(selectionStart, selectionEnd);
    const e = Math.max(selectionStart, selectionEnd);
    const data = new Float32Array(audioBuffer.getChannelData(0));
    const len = e - s;
    for (let i = 0; i < len; i++) {
      data[s + i] *= 1 - i / len;
    }
    applyEdit(createBufferFromData(data, audioBuffer.sampleRate));
  };

  const normalize = () => {
    if (!audioBuffer) return;
    const data = new Float32Array(audioBuffer.getChannelData(0));
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    if (max === 0) return;
    const gain = 1 / max;
    for (let i = 0; i < data.length; i++) {
      data[i] *= gain;
    }
    applyEdit(createBufferFromData(data, audioBuffer.sampleRate));
  };

  const silenceSelection = () => {
    if (!audioBuffer || selectionStart === null || selectionEnd === null) return;
    const s = Math.min(selectionStart, selectionEnd);
    const e = Math.max(selectionStart, selectionEnd);
    const data = new Float32Array(audioBuffer.getChannelData(0));
    for (let i = s; i < e; i++) {
      data[i] = 0;
    }
    applyEdit(createBufferFromData(data, audioBuffer.sampleRate));
  };

  const undo = () => {
    if (!prevBuffer) return;
    setAudioBuffer(prevBuffer);
    setPrevBuffer(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Export
  const exportWav = () => {
    if (!audioBuffer) return;
    const blob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? fileName.replace(/\.[^.]+$/, ".wav") : "export.wav";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasSelection = selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Waveform Editor</h1>
        {audioBuffer && (
          <button
            onClick={exportWav}
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export WAV
          </button>
        )}
      </div>

      {/* Upload / Record */}
      {!audioBuffer && (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-6">
          <svg className="w-16 h-16 text-muted mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <div>
            <p className="text-foreground text-lg font-medium mb-1">Load Audio</p>
            <p className="text-muted text-sm mb-6">Upload an audio file or record from your microphone</p>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <label className="px-6 py-3 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors">
              Upload File
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadAudio(file);
                }}
              />
            </label>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/25 transition-colors flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                Record
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-3 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 animate-pulse"
              >
                <span className="w-2.5 h-2.5 bg-white rounded-sm" />
                Stop Recording
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      {audioBuffer && (
        <>
          {/* Info panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Duration", value: formatTime(audioBuffer.duration) },
              { label: "Sample Rate", value: `${audioBuffer.sampleRate} Hz` },
              { label: "Peak Level", value: `${(peakLevel * 100).toFixed(1)}%` },
              { label: "File", value: fileName || "Unknown" },
            ].map((info) => (
              <div key={info.label} className="bg-surface border border-border rounded-2xl p-3">
                <div className="text-xs text-muted mb-0.5">{info.label}</div>
                <div className="text-sm font-medium text-foreground truncate">{info.value}</div>
              </div>
            ))}
          </div>

          {/* Waveform Canvas */}
          <div ref={containerRef} className="bg-surface border border-border rounded-2xl p-4">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg cursor-crosshair"
              style={{ height: "200px" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            {hasSelection && (
              <div className="text-xs text-muted mt-2 text-center">
                Selection: {formatTime(Math.min(selectionStart!, selectionEnd!) / audioBuffer.sampleRate)}
                {" - "}
                {formatTime(Math.max(selectionStart!, selectionEnd!) / audioBuffer.sampleRate)}
                {" ("}
                {formatTime(Math.abs(selectionEnd! - selectionStart!) / audioBuffer.sampleRate)}
                {")"}
              </div>
            )}
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                stopPlayback();
                setCursorPos(0);
              }}
              className="p-2.5 bg-surface border border-border rounded-lg text-muted hover:text-foreground transition-colors"
              title="Stop"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
            {!isPlaying ? (
              <button
                onClick={() => play()}
                className="p-3 bg-accent hover:bg-accent/80 text-white rounded-xl transition-colors"
                title="Play"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={pause}
                className="p-3 bg-accent hover:bg-accent/80 text-white rounded-xl transition-colors"
                title="Pause"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2.5 rounded-lg border transition-colors ${
                isLooping
                  ? "bg-accent/15 text-accent-light border-accent/30"
                  : "bg-surface text-muted border-border hover:text-foreground"
              }`}
              title="Loop selection"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            </button>
          </div>

          {/* Edit Operations */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="text-xs text-muted uppercase tracking-wider mb-3">Edit Operations</div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={trimSelection}
                disabled={!hasSelection}
                className="px-3 py-1.5 bg-surface-light border border-border rounded-lg text-sm text-foreground hover:bg-accent/10 hover:border-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Trim
              </button>
              <button
                onClick={fadeIn}
                disabled={!hasSelection}
                className="px-3 py-1.5 bg-surface-light border border-border rounded-lg text-sm text-foreground hover:bg-accent/10 hover:border-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Fade In
              </button>
              <button
                onClick={fadeOut}
                disabled={!hasSelection}
                className="px-3 py-1.5 bg-surface-light border border-border rounded-lg text-sm text-foreground hover:bg-accent/10 hover:border-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Fade Out
              </button>
              <button
                onClick={normalize}
                className="px-3 py-1.5 bg-surface-light border border-border rounded-lg text-sm text-foreground hover:bg-accent/10 hover:border-accent/30 transition-colors"
              >
                Normalize
              </button>
              <button
                onClick={silenceSelection}
                disabled={!hasSelection}
                className="px-3 py-1.5 bg-surface-light border border-border rounded-lg text-sm text-foreground hover:bg-accent/10 hover:border-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Silence
              </button>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={undo}
                disabled={!prevBuffer}
                className="px-3 py-1.5 bg-surface-light border border-border rounded-lg text-sm text-foreground hover:bg-accent/10 hover:border-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Undo
              </button>
            </div>
          </div>

          {/* Secondary actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground cursor-pointer transition-colors">
              Load Different File
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadAudio(file);
                }}
              />
            </label>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Record New
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium transition-colors animate-pulse flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-white rounded-sm" />
                Stop Recording
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
