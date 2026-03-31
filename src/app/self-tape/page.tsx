"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SlateInfo {
  actorName: string;
  projectName: string;
  characterName: string;
  takeNumber: number;
}

export default function SelfTapePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string>("");
  const [showGrid, setShowGrid] = useState(true);
  const [showEyeline, setShowEyeline] = useState(true);
  const [isSlating, setIsSlating] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const [slate, setSlate] = useState<SlateInfo>({
    actorName: "",
    projectName: "",
    characterName: "",
    takeNumber: 1,
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: "user" },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      alert("Camera access denied. Please enable camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  useEffect(() => { return () => { stopCamera(); if (timerRef.current) clearInterval(timerRef.current); }; }, [stopCamera]);

  const startRecording = useCallback(() => {
    if (!videoRef.current?.srcObject) return;
    chunksRef.current = [];
    const stream = videoRef.current.srcObject as MediaStream;
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setHasRecording(true);
    };
    mediaRecorderRef.current = recorder;

    if (slate.actorName) {
      setIsSlating(true);
      setTimeout(() => {
        setIsSlating(false);
        recorder.start();
        setIsRecording(true);
        setDuration(0);
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      }, 3000);
    } else {
      recorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
  }, [slate.actorName]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setSlate((prev) => ({ ...prev, takeNumber: prev.takeNumber + 1 }));
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Self-Tape Studio</h1>
      <p className="text-muted mb-8">Record, frame, and export audition-ready self-tapes</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera View */}
        <div className="lg:col-span-2">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            <canvas ref={canvasRef} className="hidden" />

            {/* Frame Grid Overlay */}
            {showGrid && cameraActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
                {/* Head room guide */}
                <div className="absolute top-[10%] left-1/4 right-1/4 h-px bg-accent/40 border-t border-dashed border-accent/40" />
                {/* Shoulder width */}
                <div className="absolute top-[60%] left-[15%] right-[15%] h-px bg-accent/30" />
              </div>
            )}

            {/* Eyeline Dot */}
            {showEyeline && cameraActive && (
              <div className="absolute top-[8%] left-1/2 -translate-x-1/2">
                <div className="w-4 h-4 bg-success rounded-full animate-pulse shadow-lg shadow-success/50" />
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-success whitespace-nowrap">Look here</span>
              </div>
            )}

            {/* Auto-Slate Overlay */}
            {isSlating && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <div className="text-4xl font-bold mb-2">{slate.actorName || "Actor"}</div>
                  <div className="text-xl text-muted mb-1">{slate.projectName || "Project"}</div>
                  <div className="text-lg text-accent-light">{slate.characterName || "Character"} — Take {slate.takeNumber}</div>
                  <div className="mt-4 text-sm text-muted animate-pulse">Recording starting...</div>
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
                <span className="w-3 h-3 bg-danger rounded-full recording-active" />
                <span className="text-white text-sm font-mono">{formatTime(duration)}</span>
              </div>
            )}

            {/* Camera Not Active */}
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={startCamera} className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Enable Camera
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            {!isRecording ? (
              <button onClick={startRecording} disabled={!cameraActive} className="bg-danger hover:bg-danger/80 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
                <span className="w-4 h-4 bg-white rounded-full" />
                Record
              </button>
            ) : (
              <button onClick={stopRecording} className="bg-surface-light hover:bg-border text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
                Stop
              </button>
            )}
          </div>

          {/* Recorded Take */}
          {hasRecording && (
            <div className="mt-6 bg-surface border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">Recorded Take</h3>
              <video src={recordedUrl} controls className="w-full rounded-lg mb-3" />
              <div className="flex gap-3">
                <a href={recordedUrl} download={`${slate.actorName || "selftape"}_take${slate.takeNumber - 1}.webm`} className="flex-1 bg-accent hover:bg-accent-dark text-white font-medium py-2.5 rounded-lg text-center text-sm transition-colors">
                  Export Take
                </a>
                <button onClick={() => { setHasRecording(false); setRecordedUrl(""); }} className="px-4 py-2.5 bg-surface-light hover:bg-border text-sm rounded-lg transition-colors">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* Slate Info */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Auto-Slate</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted block mb-1">Actor Name</label>
                <input type="text" value={slate.actorName} onChange={(e) => setSlate((p) => ({ ...p, actorName: e.target.value }))} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Project</label>
                <input type="text" value={slate.projectName} onChange={(e) => setSlate((p) => ({ ...p, projectName: e.target.value }))} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Project name" />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Character</label>
                <input type="text" value={slate.characterName} onChange={(e) => setSlate((p) => ({ ...p, characterName: e.target.value }))} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="Character name" />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Take #</label>
                <input type="number" min={1} value={slate.takeNumber} onChange={(e) => setSlate((p) => ({ ...p, takeNumber: parseInt(e.target.value) || 1 }))} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
          </div>

          {/* Frame Guides */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Frame Guides</h3>
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className="text-sm">Grid overlay</span>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-accent" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Eyeline dot</span>
              <input type="checkbox" checked={showEyeline} onChange={(e) => setShowEyeline(e.target.checked)} className="accent-accent" />
            </label>
          </div>

          {/* Export Settings */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Export</h3>
            <p className="text-sm text-muted">1080p WebM format. Compatible with Actors Access and Casting Networks upload requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
