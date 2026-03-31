"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Segment {
  id: string;
  genre: string;
  scriptPrompt: string;
  recorded: boolean;
  blob: Blob | null;
  playbackUrl: string | null;
  durationSec: number;
}

const GENRE_SEGMENTS: Omit<Segment, "recorded" | "blob" | "playbackUrl" | "durationSec">[] = [
  { id: "commercial", genre: "Commercial", scriptPrompt: "Introducing the all-new Horizon EV. Zero emissions. Zero compromises. Test drive yours this weekend at any Horizon dealership." },
  { id: "narration", genre: "Narration", scriptPrompt: "The rain had not stopped for three days. Margaret stood at the window, watching the garden slowly disappear beneath rising water, wondering if anyone would come." },
  { id: "character", genre: "Character", scriptPrompt: "Well well well, look who finally showed up. You know, where I come from, we have a saying: never trust a wizard who smiles before breakfast." },
  { id: "promo", genre: "Promo", scriptPrompt: "This Sunday on Discovery Channel: they risked everything to find what lies beneath. Expedition Unknown, the season premiere, Sunday at nine." },
  { id: "medical", genre: "Medical/Pharma", scriptPrompt: "Ask your doctor if Relvantix is right for you. In clinical trials, patients experienced a 40 percent reduction in symptoms. Side effects may include headache and dizziness." },
  { id: "tech", genre: "Tech/E-learning", scriptPrompt: "In this module, you will learn the fundamentals of cloud architecture. Please note that all exercises require an active AWS account to complete." },
  { id: "trailer", genre: "Trailer", scriptPrompt: "In a world where silence means survival... one voice will shatter everything. This fall, hear the sound of defiance." },
];

export default function DemoReelPage() {
  const [segments, setSegments] = useState<Segment[]>(
    GENRE_SEGMENTS.map((g) => ({ ...g, recorded: false, blob: null, playbackUrl: null, durationSec: 0 }))
  );
  const [segmentOrder, setSegmentOrder] = useState<string[]>(GENRE_SEGMENTS.map((g) => g.id));
  const [recordingSegmentId, setRecordingSegmentId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [projectTitle, setProjectTitle] = useState("My Demo Reel");
  const [savedToDb, setSavedToDb] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewCtxRef = useRef<AudioContext | null>(null);

  const recordedSegments = segments.filter((s) => s.recorded);
  const recordedCount = recordedSegments.length;
  const totalCount = segments.length;
  const progressPercent = (recordedCount / totalCount) * 100;

  const handleRecord = async (segmentId: string) => {
    if (recordingSegmentId === segmentId) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setRecordingSegmentId(null);
    } else {
      // Start recording
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
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const durationSec = Math.round((Date.now() - recordStartRef.current) / 100) / 10;
          const url = URL.createObjectURL(blob);

          setSegments((prev) =>
            prev.map((s) =>
              s.id === segmentId
                ? { ...s, recorded: true, blob, playbackUrl: url, durationSec }
                : s
            )
          );
        };
        mediaRecorderRef.current = recorder;
        recorder.start(100);
        setRecordingSegmentId(segmentId);
      } catch {
        alert("Microphone access required for recording.");
      }
    }
  };

  const handleClearRecording = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => {
        if (s.id === segmentId) {
          if (s.playbackUrl) URL.revokeObjectURL(s.playbackUrl);
          return { ...s, recorded: false, blob: null, playbackUrl: null, durationSec: 0 };
        }
        return s;
      })
    );
  };

  const playSegment = (segment: Segment) => {
    if (!segment.playbackUrl) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(segment.playbackUrl);
    audioRef.current = audio;
    audio.play();
  };

  const assembleAndPreview = async () => {
    const orderedRecorded = segmentOrder
      .map((id) => segments.find((s) => s.id === id))
      .filter((s): s is Segment => !!s && s.recorded && !!s.blob);

    if (orderedRecorded.length < 2) {
      alert("Record at least 2 segments before previewing.");
      return;
    }

    setIsPlayingPreview(true);

    // Concatenate audio buffers
    const audioCtx = new AudioContext();
    previewCtxRef.current = audioCtx;
    const buffers: AudioBuffer[] = [];

    for (const seg of orderedRecorded) {
      if (!seg.blob) continue;
      try {
        const arrayBuffer = await seg.blob.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        buffers.push(decoded);
      } catch { /* skip undecodable */ }
    }

    if (buffers.length === 0) {
      setIsPlayingPreview(false);
      audioCtx.close();
      return;
    }

    // Calculate total length
    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
    const sampleRate = buffers[0].sampleRate;
    const combined = audioCtx.createBuffer(1, totalLength, sampleRate);
    const output = combined.getChannelData(0);

    let offset = 0;
    for (const buf of buffers) {
      const data = buf.getChannelData(0);
      output.set(data, offset);
      offset += buf.length;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = combined;
    source.connect(audioCtx.destination);
    source.onended = () => {
      setIsPlayingPreview(false);
    };
    previewSourceRef.current = source;
    source.start();
  };

  const stopPreview = () => {
    if (previewSourceRef.current) {
      try { previewSourceRef.current.stop(); } catch { /* already stopped */ }
    }
    if (previewCtxRef.current) {
      previewCtxRef.current.close();
      previewCtxRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, segmentId: string) => {
    e.dataTransfer.setData("text/plain", segmentId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(targetId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId === targetId) return;

    setSegmentOrder((prev) => {
      const newOrder = [...prev];
      const sourceIdx = newOrder.indexOf(sourceId);
      const targetIdx = newOrder.indexOf(targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, sourceId);
      return newOrder;
    });
  };

  const saveProject = async () => {
    const segmentsForDb = segments.map((s) => ({
      id: s.id,
      genre: s.genre,
      recorded: s.recorded,
      durationSec: s.durationSec,
    }));

    try {
      if (projectId) {
        await fetch("/api/vo-tools/demo-reel", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: projectId, title: projectTitle, segments: segmentsForDb, segment_order: segmentOrder }),
        });
      } else {
        const res = await fetch("/api/vo-tools/demo-reel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: projectTitle, segments: segmentsForDb, segment_order: segmentOrder }),
        });
        if (res.ok) {
          const data = await res.json();
          setProjectId(data.id);
        }
      }
      setSavedToDb(true);
      setTimeout(() => setSavedToDb(false), 2000);
    } catch {
      alert("Failed to save project.");
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      segments.forEach((s) => { if (s.playbackUrl) URL.revokeObjectURL(s.playbackUrl); });
      if (previewCtxRef.current) previewCtxRef.current.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const orderedSegments = segmentOrder.map((id) => segments.find((s) => s.id === id)).filter((s): s is Segment => !!s);
  const totalDuration = segments.filter((s) => s.recorded).reduce((sum, s) => sum + s.durationSec, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Demo Reel Producer</h1>
      <p className="text-muted mb-8">Build a broadcast-standard VO demo reel with 7 genre segments.</p>

      {/* Project Header */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="Project title"
        />
        <button onClick={saveProject} className="bg-success/15 text-success hover:bg-success/25 font-medium px-5 py-2 rounded-lg text-sm transition-colors border border-success/30">
          {savedToDb ? "Saved" : "Save Project"}
        </button>
      </div>

      {/* Progress Tracker */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Progress</h2>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{recordedCount} of {totalCount} segments</span>
            <span>{totalDuration.toFixed(1)}s total</span>
          </div>
        </div>
        <div className="h-3 bg-surface-light rounded-full overflow-hidden mb-4">
          <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex gap-2">
          {orderedSegments.map((s) => (
            <div key={s.id} className={`flex-1 h-2 rounded-full ${s.recorded ? "bg-success" : "bg-surface-light"}`} title={s.genre} />
          ))}
        </div>
      </div>

      {/* Segments List (draggable) */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Segments</h2>
          <span className="text-xs text-muted">Drag to reorder</span>
        </div>
        {orderedSegments.map((segment, idx) => (
          <div
            key={segment.id}
            draggable
            onDragStart={(e) => handleDragStart(e, segment.id)}
            onDragOver={(e) => handleDragOver(e, segment.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, segment.id)}
            className={`bg-surface border rounded-xl p-5 transition-colors cursor-grab active:cursor-grabbing ${
              dragOverId === segment.id ? "border-accent" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-muted font-mono w-5">{idx + 1}.</span>
                  <span className={`w-3 h-3 rounded-full ${segment.recorded ? "bg-success" : "bg-surface-light"}`} />
                  <h3 className="font-semibold">{segment.genre}</h3>
                  {segment.recorded && (
                    <>
                      <span className="text-xs bg-success/15 text-success border border-success/30 px-2 py-0.5 rounded">
                        Recorded
                      </span>
                      <span className="text-xs text-muted">{segment.durationSec}s</span>
                    </>
                  )}
                </div>
                <div className="bg-surface-light rounded-lg p-3 text-sm leading-relaxed">
                  &ldquo;{segment.scriptPrompt}&rdquo;
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {segment.recorded ? (
                  <>
                    <button onClick={() => playSegment(segment)} className="bg-surface-light hover:bg-border text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                      Play
                    </button>
                    <button onClick={() => handleClearRecording(segment.id)} className="bg-danger/15 text-danger hover:bg-danger/25 text-sm px-3 py-2 rounded-lg transition-colors">
                      Redo
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleRecord(segment.id)}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors font-medium ${
                      recordingSegmentId === segment.id ? "bg-danger text-white animate-pulse" : "bg-accent hover:bg-accent-dark text-white"
                    }`}>
                    {recordingSegmentId === segment.id ? "Stop" : "Record"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assemble & Preview */}
      <div className="flex flex-wrap items-center gap-4">
        {!isPlayingPreview ? (
          <button onClick={assembleAndPreview} disabled={recordedCount < 2}
            className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg disabled:opacity-40">
            Preview Assembled Reel
          </button>
        ) : (
          <button onClick={stopPreview} className="bg-danger hover:bg-danger/80 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg">
            Stop Preview
          </button>
        )}
        <button onClick={() => setShowPreview(true)} disabled={recordedCount < 2}
          className="bg-surface border border-border hover:border-accent/30 text-foreground font-medium px-6 py-3.5 rounded-xl transition-colors disabled:opacity-40">
          View Reel Order
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Reel: {projectTitle}</h2>
            <div className="space-y-3 mb-6">
              {segmentOrder
                .map((id) => segments.find((s) => s.id === id))
                .filter((s): s is Segment => !!s && s.recorded)
                .map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 bg-surface-light rounded-lg p-3">
                    <span className="text-sm font-mono text-muted w-6">{i + 1}.</span>
                    <span className="text-sm font-medium flex-1">{s.genre}</span>
                    <span className="text-xs text-muted">{s.durationSec}s</span>
                  </div>
                ))}
            </div>
            <div className="text-sm text-muted text-center mb-4">
              Total duration: {totalDuration.toFixed(1)}s
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPreview(false)} className="flex-1 bg-surface-light hover:bg-border text-foreground font-medium py-3 rounded-xl transition-colors">
                Close
              </button>
              <button onClick={() => { assembleAndPreview(); setShowPreview(false); }} className="flex-1 bg-accent hover:bg-accent-dark text-white font-medium py-3 rounded-xl transition-colors">
                Play Reel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
