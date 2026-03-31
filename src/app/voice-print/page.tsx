"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { VoicePrintSegment } from "@/types";

interface Segment {
  type: VoicePrintSegment;
  label: string;
  description: string;
  prompt: string;
  status: "pending" | "recorded" | "approved" | "rejected";
  audioUrl?: string;
  audioBase64?: string;
  qualityScore?: number;
  durationSec?: number;
}

const SEGMENT_DEFS: Omit<Segment, "status">[] = [
  { type: "conversational", label: "Conversational", description: "Natural, everyday speech patterns", prompt: "Read this as if you're talking to a friend over coffee: 'So I was thinking, maybe we should try that new place on Fifth Street this weekend. I heard the pasta is incredible -- and you know how picky I am about pasta.'" },
  { type: "commercial", label: "Commercial", description: "Warm, engaging sell reads", prompt: "Read with friendly energy: 'Introducing the all-new Horizon smartwatch. It doesn't just tell time -- it tells your story. Track your health, stay connected, and look incredible doing it. Horizon. Your time, elevated.'" },
  { type: "dramatic", label: "Dramatic Reading", description: "Emotionally charged literary passages", prompt: "Read with emotional depth: 'She stood at the edge of the cliff, the wind pulling at her coat like a child begging for attention. Below, the sea churned grey and white. She had come here to make a decision -- and the sea, as always, was indifferent to the outcome.'" },
  { type: "character", label: "Character Voices", description: "Distinct character transformations", prompt: "Perform three distinct voices: 1) A wise elderly mentor: 'Listen carefully, young one...' 2) An excited child: 'Can we go? Can we go? PLEASE!' 3) A tired detective: 'Another case. Another long night. Same bad coffee.'" },
  { type: "whisper-to-projection", label: "Whisper to Projection", description: "Full dynamic range of your voice", prompt: "Start as a whisper and gradually build to full projection: 'It started with a rumour... then it became a conversation... then it became a movement... then it became a REVOLUTION -- AND NOTHING WOULD EVER BE THE SAME!'" },
  { type: "emotional-range", label: "Emotional Range", description: "Joy, sorrow, anger, fear, love", prompt: "Read the same line five ways -- joyful, sorrowful, angry, fearful, loving: 'I know what you did last summer.'" },
  { type: "technical", label: "Technical Read", description: "Complex terminology and precision", prompt: "Read clearly and precisely: 'The recommended dosage of acetaminophen for adults is 500 to 1000 milligrams every 4 to 6 hours, not exceeding 4000 milligrams in a 24-hour period. Patients with hepatic impairment should consult their physician.'" },
  { type: "narration", label: "Narration", description: "Long-form storytelling voice", prompt: "Read as a narrator: 'Chapter One. The morning of September 14th began like any other in the small coastal town of Millhaven -- with fog, with silence, and with the distant sound of a bell that no one could quite locate.'" },
  { type: "promo", label: "Promo / Imaging", description: "High-energy broadcast style", prompt: "Read with maximum energy: 'THIS Sunday -- the event that changes EVERYTHING. Live from Madison Square Garden -- it's the CHAMPIONSHIP FINALS! Two teams. One trophy. No second chances. Sunday at 8, ONLY on Network One!'" },
  { type: "e-learning", label: "E-Learning", description: "Clear, authoritative instruction", prompt: "Read in an instructional tone: 'In this module, you will learn three key strategies for effective client communication. First, active listening -- which means giving your full attention to the speaker without planning your response while they are still talking.'" },
  { type: "medical", label: "Medical Narration", description: "Pharmaceutical and health content", prompt: "Read with clinical authority: 'Pembrolizumab is a humanised monoclonal antibody that targets the programmed death receptor PD-1. It is indicated for the treatment of unresectable or metastatic melanoma, non-small cell lung carcinoma, and classical Hodgkin lymphoma.'" },
  { type: "podcast", label: "Podcast / Documentary", description: "Conversational authority", prompt: "Read as a podcast host: 'Welcome back to another episode. Today we are going to talk about something that almost nobody discusses -- the real reason most startups fail. And spoiler: it is not about the money. It is about something much harder to fix.'" },
];

function computeQualityScore(durationSec: number, rmsLevel: number): number {
  // Duration score: ideal is 8-30s per segment
  let durationScore = 100;
  if (durationSec < 3) durationScore = 30;
  else if (durationSec < 5) durationScore = 60;
  else if (durationSec < 8) durationScore = 80;
  else if (durationSec > 60) durationScore = 70;

  // Volume score: RMS should be above 0.01 (not silent) and below 0.8 (not clipping)
  let volumeScore = 100;
  if (rmsLevel < 0.005) volumeScore = 20; // basically silence
  else if (rmsLevel < 0.01) volumeScore = 50;
  else if (rmsLevel < 0.02) volumeScore = 70;
  else if (rmsLevel > 0.8) volumeScore = 60; // clipping
  else if (rmsLevel > 0.5) volumeScore = 85;

  return Math.round(durationScore * 0.5 + volumeScore * 0.5);
}

export default function VoicePrintPage() {
  const [segments, setSegments] = useState<Segment[]>(
    SEGMENT_DEFS.map((d) => ({ ...d, status: "pending" as const }))
  );
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<"in-progress" | "completed" | "submitted">("in-progress");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const completedCount = segments.filter(
    (s) => s.status === "recorded" || s.status === "approved"
  ).length;
  const progress = (completedCount / segments.length) * 100;

  // Load existing session from API
  useEffect(() => {
    fetch("/api/voice-print")
      .then((r) => (r.ok ? r.json() : []))
      .then((sessions: any[]) => {
        if (sessions.length > 0) {
          const latest = sessions[0];
          setDbSessionId(latest.id);
          setSessionStatus(latest.status);
          // Restore segment data
          if (latest.segments && latest.segments.length === 12) {
            setSegments((prev) =>
              prev.map((seg, i) => {
                const saved = latest.segments[i];
                if (saved && saved.status !== "pending") {
                  return {
                    ...seg,
                    status: saved.status,
                    qualityScore: saved.qualityScore || undefined,
                    audioBase64: saved.audioBase64 || undefined,
                    durationSec: saved.durationSec || undefined,
                  };
                }
                return seg;
              })
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  // Create session on first recording
  const ensureSession = useCallback(async () => {
    if (dbSessionId) return dbSessionId;
    try {
      const res = await fetch("/api/voice-print", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDbSessionId(data.id);
        return data.id;
      }
    } catch {}
    return null;
  }, [dbSessionId]);

  // Save segments to server
  const saveToServer = useCallback(
    async (updatedSegments: Segment[], status?: string) => {
      const sid = dbSessionId || (await ensureSession());
      if (!sid) return;
      setSaving(true);
      try {
        const segData = updatedSegments.map((s) => ({
          type: s.type,
          status: s.status,
          audioBase64: s.audioBase64 || null,
          qualityScore: s.qualityScore || null,
          durationSec: s.durationSec || null,
        }));
        await fetch("/api/voice-print", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            segments: segData,
            status: status || undefined,
          }),
        });
      } catch {}
      setSaving(false);
    },
    [dbSessionId, ensureSession]
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up Web Audio API for RMS analysis
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const durationSec = (Date.now() - recordingStartRef.current) / 1000;

        // Compute RMS from analyser
        let rmsLevel = 0.05; // default reasonable value
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          rmsLevel = Math.sqrt(sumSquares / dataArray.length);
        }

        const qualityScore = computeQualityScore(durationSec, rmsLevel);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const updatedSegments = segments.map((s, i) =>
            i === activeSegment
              ? {
                  ...s,
                  status: "recorded" as const,
                  audioUrl: url,
                  audioBase64: base64,
                  qualityScore,
                  durationSec,
                }
              : s
          );
          setSegments(updatedSegments);
          saveToServer(updatedSegments);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((t) => t.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer for recording duration display
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      alert("Microphone access denied.");
    }
  }, [activeSegment, segments, saveToServer]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const allRecorded = segments.every(
      (s) => s.status === "recorded" || s.status === "approved"
    );
    if (!allRecorded) return;
    setSessionStatus("submitted");
    await saveToServer(segments, "submitted");
  }, [segments, saveToServer]);

  const current = segments[activeSegment];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Voice Print Builder</h1>
      <p className="text-muted mb-6">
        Record your professional voice asset for ElevenLabs Marketplace
        submission.
        {saving && (
          <span className="ml-2 text-xs text-accent-light">Saving...</span>
        )}
      </p>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted">
            {completedCount} of {segments.length} segments recorded
          </span>
          <span className="text-sm font-medium text-accent-light">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-surface-light rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Segment List */}
        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          {segments.map((seg, i) => (
            <button
              key={seg.type}
              onClick={() => !isRecording && setActiveSegment(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeSegment === i
                  ? "bg-accent/10 border border-accent/30"
                  : "hover:bg-surface-light"
              } ${isRecording && activeSegment !== i ? "opacity-50" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  seg.status === "recorded" || seg.status === "approved"
                    ? "bg-success text-white"
                    : seg.status === "rejected"
                    ? "bg-danger text-white"
                    : "bg-surface-light text-muted"
                }`}
              >
                {seg.status === "recorded" || seg.status === "approved" ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{seg.label}</div>
                <div className="text-xs text-muted truncate">
                  {seg.description}
                </div>
              </div>
              {seg.qualityScore !== undefined && (
                <span
                  className={`text-xs font-medium ml-auto shrink-0 ${
                    seg.qualityScore >= 90
                      ? "text-success"
                      : seg.qualityScore >= 70
                      ? "text-warning"
                      : "text-danger"
                  }`}
                >
                  {seg.qualityScore}%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Recording Area */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{current.label}</h2>
                <p className="text-sm text-muted">{current.description}</p>
              </div>
              <span className="text-sm font-medium">
                {activeSegment + 1} / {segments.length}
              </span>
            </div>

            {/* Script Prompt */}
            <div className="bg-surface-light rounded-xl p-5 mb-6">
              <p className="text-sm text-muted mb-2 uppercase tracking-wide font-medium">
                Read this:
              </p>
              <p className="text-lg leading-relaxed">{current.prompt}</p>
            </div>

            {/* Quality Indicator */}
            {current.qualityScore !== undefined && (
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    current.qualityScore >= 90
                      ? "bg-success/15 text-success"
                      : current.qualityScore >= 70
                      ? "bg-warning/15 text-warning"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  Quality: {current.qualityScore}%
                </div>
                {current.qualityScore >= 90 && (
                  <span className="text-xs text-success">
                    Meets ElevenLabs standards
                  </span>
                )}
                {current.durationSec !== undefined && (
                  <span className="text-xs text-muted">
                    Duration: {current.durationSec.toFixed(1)}s
                  </span>
                )}
              </div>
            )}

            {/* Audio Playback */}
            {current.audioUrl && (
              <div className="mb-4">
                <audio src={current.audioUrl} controls className="w-full" />
              </div>
            )}

            {/* Recording Timer */}
            {isRecording && (
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="w-3 h-3 bg-danger rounded-full animate-pulse" />
                <span className="text-lg font-mono text-danger">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-danger hover:bg-danger/80 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  <span className="w-4 h-4 bg-white rounded-full" />
                  {current.status === "recorded" ? "Re-Record" : "Record"}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-surface-light hover:bg-border text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop
                </button>
              )}

              {!isRecording && activeSegment < segments.length - 1 && (
                <button
                  onClick={() =>
                    setActiveSegment((i) => Math.min(i + 1, segments.length - 1))
                  }
                  className="bg-accent hover:bg-accent-dark text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Next Segment
                </button>
              )}
            </div>
          </div>

          {/* Export / Submit */}
          {completedCount === segments.length && (
            <div className="mt-6 bg-success/10 border border-success/20 rounded-2xl p-6 text-center">
              {sessionStatus === "submitted" ? (
                <>
                  <h3 className="text-xl font-bold text-success mb-2">
                    Submitted!
                  </h3>
                  <p className="text-muted">
                    Your voice print has been submitted for review.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-success mb-2">
                    All Segments Recorded!
                  </h3>
                  <p className="text-muted mb-4">
                    Your voice print is ready for ElevenLabs Marketplace
                    submission.
                  </p>
                  <button
                    onClick={handleSubmit}
                    className="bg-success hover:bg-success/80 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                  >
                    Export Submission Package
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
