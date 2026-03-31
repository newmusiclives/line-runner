"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceProfile {
  pitchCenter: number;
  tempo: number;
  resonance: string;
}

interface SessionScore {
  id: string;
  sessionNumber: number;
  score: number;
  date: string;
  pitchHz: number;
  pitchDrift: number;
  tempoDrift: number;
  notes: string;
}

interface ReferenceLine {
  id: string;
  text: string;
  recorded: boolean;
  blob: Blob | null;
  playbackUrl: string | null;
}

const DEFAULT_REFERENCE_LINES: ReferenceLine[] = [
  { id: "r1", text: "The ancient oak stood sentinel at the crossroads, its branches reaching toward a sky the color of old pewter.", recorded: false, blob: null, playbackUrl: null },
  { id: "r2", text: "Listen closely, traveler, for these words carry the weight of a thousand winters and the promise of spring.", recorded: false, blob: null, playbackUrl: null },
  { id: "r3", text: "In the kingdom of Ashenvale, there was only one rule that mattered: never trust the silence.", recorded: false, blob: null, playbackUrl: null },
];

function scoreColor(score: number): string {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-danger";
}

function scoreBadge(score: number): string {
  if (score >= 90) return "bg-success/15 text-success border-success/30";
  if (score >= 70) return "bg-warning/15 text-warning border-warning/30";
  return "bg-danger/15 text-danger border-danger/30";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Consistent";
  if (score >= 70) return "Drifting";
  return "Off-Character";
}

// Autocorrelation-based pitch detection
function detectPitch(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const size = Math.min(data.length, sampleRate); // analyze up to 1s
  const maxLag = Math.floor(sampleRate / 60); // min 60 Hz
  const minLag = Math.floor(sampleRate / 500); // max 500 Hz

  let bestCorrelation = 0;
  let bestLag = minLag;

  for (let lag = minLag; lag < maxLag && lag < size / 2; lag++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;
    const windowSize = Math.min(size - lag, 2048);
    for (let i = 0; i < windowSize; i++) {
      correlation += data[i] * data[i + lag];
      norm1 += data[i] * data[i];
      norm2 += data[i + lag] * data[i + lag];
    }
    if (norm1 > 0 && norm2 > 0) {
      correlation /= Math.sqrt(norm1 * norm2);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }
  }

  if (bestCorrelation < 0.3) return 0; // No clear pitch
  return Math.round(sampleRate / bestLag);
}

// Estimate speaking tempo from envelope
function estimateTempo(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const hop = Math.floor(windowSize / 2);

  // Compute envelope
  const envelope: number[] = [];
  for (let i = 0; i < data.length - windowSize; i += hop) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) sum += data[i + j] * data[i + j];
    envelope.push(Math.sqrt(sum / windowSize));
  }

  // Count peaks in envelope (syllables)
  let peaks = 0;
  const threshold = Math.max(...envelope) * 0.2;
  let aboveThreshold = false;
  for (let i = 1; i < envelope.length; i++) {
    if (envelope[i] > threshold && !aboveThreshold) {
      peaks++;
      aboveThreshold = true;
    } else if (envelope[i] < threshold * 0.5) {
      aboveThreshold = false;
    }
  }

  const durationMin = buffer.duration / 60;
  // Approximate words as syllables / 1.5
  const estimatedWords = peaks / 1.5;
  return durationMin > 0 ? Math.round(estimatedWords / durationMin) : 0;
}

export default function VoiceConsistencyPage() {
  const [projectName, setProjectName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [isSetUp, setIsSetUp] = useState(false);
  const [referenceLines, setReferenceLines] = useState<ReferenceLine[]>(DEFAULT_REFERENCE_LINES);
  const [isRecordingRef, setIsRecordingRef] = useState<string | null>(null);
  const [profileEstablished, setProfileEstablished] = useState(false);
  const [sessions, setSessions] = useState<SessionScore[]>([]);
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [currentSessionScore, setCurrentSessionScore] = useState<number | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({ pitchCenter: 0, tempo: 0, resonance: "" });
  const [savedToDb, setSavedToDb] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const comparisonCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawComparisonChart = useCallback((sessionsData: SessionScore[], profile: VoiceProfile) => {
    const canvas = comparisonCanvasRef.current;
    if (!canvas || sessionsData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#2d2d3f";
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += h / 4) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Reference pitch line
    ctx.strokeStyle = "rgba(162, 155, 254, 0.4)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    const refY = h * 0.5;
    ctx.beginPath();
    ctx.moveTo(40, refY);
    ctx.lineTo(w, refY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot pitch for each session
    const maxSessions = Math.min(sessionsData.length, 20);
    const recentSessions = sessionsData.slice(-maxSessions);
    const barWidth = (w - 60) / maxSessions;

    for (let i = 0; i < recentSessions.length; i++) {
      const s = recentSessions[i];
      const x = 50 + i * barWidth;

      // Pitch deviation bar
      const deviation = profile.pitchCenter > 0 ? (s.pitchHz - profile.pitchCenter) / profile.pitchCenter : 0;
      const barHeight = Math.abs(deviation) * h * 2;
      const barY = deviation >= 0 ? refY - barHeight : refY;

      const color = s.score >= 90 ? "#00b894" : s.score >= 70 ? "#fdcb6e" : "#e17055";
      ctx.fillStyle = color + "80";
      ctx.fillRect(x, barY, barWidth - 4, barHeight);

      // Score label
      ctx.fillStyle = color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${s.score}%`, x + (barWidth - 4) / 2, h - 4);

      // Session number
      ctx.fillStyle = "#6c6c8a";
      ctx.fillText(`S${s.sessionNumber}`, x + (barWidth - 4) / 2, 12);
    }

    // Labels
    ctx.fillStyle = "#6c6c8a";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText("Ref", 36, refY + 4);
  }, []);

  const analyzeReferenceRecordings = useCallback(async (lines: ReferenceLine[]) => {
    const pitches: number[] = [];
    const tempos: number[] = [];
    const audioCtx = new AudioContext();

    for (const line of lines) {
      if (!line.blob) continue;
      try {
        const arrayBuffer = await line.blob.arrayBuffer();
        const buffer = await audioCtx.decodeAudioData(arrayBuffer);
        const pitch = detectPitch(buffer);
        const tempo = estimateTempo(buffer);
        if (pitch > 0) pitches.push(pitch);
        if (tempo > 0) tempos.push(tempo);
      } catch { /* skip */ }
    }

    audioCtx.close();

    const avgPitch = pitches.length > 0 ? Math.round(pitches.reduce((a, b) => a + b, 0) / pitches.length) : 150;
    const avgTempo = tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 160;
    const resonance = avgPitch < 120 ? "Low chest" : avgPitch < 180 ? "Mid-chest" : avgPitch < 250 ? "Head voice" : "High head";

    return { pitchCenter: avgPitch, tempo: avgTempo, resonance };
  }, []);

  const handleSetup = () => {
    if (!projectName.trim() || !characterName.trim()) return;
    setIsSetUp(true);
  };

  const handleRecordReference = async (lineId: string) => {
    if (isRecordingRef === lineId) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingRef(null);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        streamRef.current = stream;
        chunksRef.current = [];

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);

          setReferenceLines((prev) => {
            const updated = prev.map((l) =>
              l.id === lineId ? { ...l, recorded: true, blob, playbackUrl: url } : l
            );
            // Check if all are now recorded
            const allRecorded = updated.every((l) => l.recorded);
            if (allRecorded) {
              // Analyze after a tick
              setTimeout(async () => {
                const profile = await analyzeReferenceRecordings(updated);
                setVoiceProfile(profile);
                setProfileEstablished(true);
              }, 100);
            }
            return updated;
          });
        };
        mediaRecorderRef.current = recorder;
        recorder.start(100);
        setIsRecordingRef(lineId);
      } catch {
        alert("Microphone access required.");
      }
    }
  };

  const playReference = (line: ReferenceLine) => {
    if (!line.playbackUrl) return;
    const audio = new Audio(line.playbackUrl);
    audio.play();
  };

  const handleRecordSession = async () => {
    if (isRecordingSession) {
      // Stop
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingSession(false);
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        streamRef.current = stream;
        chunksRef.current = [];

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });

          // Analyze the session recording
          const audioCtx = new AudioContext();
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = await audioCtx.decodeAudioData(arrayBuffer);
            const pitch = detectPitch(buffer);
            const tempo = estimateTempo(buffer);

            const pitchDrift = voiceProfile.pitchCenter > 0
              ? Math.round(Math.abs(pitch - voiceProfile.pitchCenter) / voiceProfile.pitchCenter * 100)
              : 0;
            const tempoDrift = voiceProfile.tempo > 0
              ? Math.round(Math.abs(tempo - voiceProfile.tempo) / voiceProfile.tempo * 100)
              : 0;

            // Score: 100 minus penalties
            const score = Math.max(0, Math.min(100, 100 - pitchDrift * 2 - tempoDrift * 1.5));
            const roundedScore = Math.round(score);

            setCurrentSessionScore(roundedScore);
            const newSession: SessionScore = {
              id: `s-${Date.now()}`,
              sessionNumber: sessions.length + 1,
              score: roundedScore,
              date: new Date().toISOString().split("T")[0],
              pitchHz: pitch,
              pitchDrift,
              tempoDrift,
              notes: "",
            };
            setSessions((prev) => {
              const updated = [...prev, newSession];
              // Redraw chart
              setTimeout(() => drawComparisonChart(updated, voiceProfile), 50);
              return updated;
            });
          } catch { /* decode error */ }
          audioCtx.close();
        };
        mediaRecorderRef.current = recorder;
        recorder.start(100);
        setIsRecordingSession(true);
        setCurrentSessionScore(null);
      } catch {
        alert("Microphone access required.");
      }
    }
  };

  const saveProfile = async () => {
    const sessionsForDb = sessions.map((s) => ({
      sessionNumber: s.sessionNumber,
      score: s.score,
      date: s.date,
      pitchHz: s.pitchHz,
      pitchDrift: s.pitchDrift,
      tempoDrift: s.tempoDrift,
      notes: s.notes,
    }));

    try {
      if (profileId) {
        await fetch("/api/vo-tools/voice-profiles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: profileId,
            pitch_center: voiceProfile.pitchCenter,
            tempo: voiceProfile.tempo,
            resonance: voiceProfile.resonance,
            sessions: sessionsForDb,
          }),
        });
      } else {
        const res = await fetch("/api/vo-tools/voice-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_name: projectName,
            character_name: characterName,
            pitch_center: voiceProfile.pitchCenter,
            tempo: voiceProfile.tempo,
            resonance: voiceProfile.resonance,
            sessions: sessionsForDb,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setProfileId(data.id);
        }
      }
      setSavedToDb(true);
      setTimeout(() => setSavedToDb(false), 2000);
    } catch {
      alert("Failed to save profile.");
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      referenceLines.forEach((l) => { if (l.playbackUrl) URL.revokeObjectURL(l.playbackUrl); });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profileEstablished && sessions.length > 0) {
      drawComparisonChart(sessions, voiceProfile);
    }
  }, [profileEstablished, sessions, voiceProfile, drawComparisonChart]);

  const allRefsRecorded = referenceLines.every((l) => l.recorded);

  // Setup screen
  if (!isSetUp) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Voice Consistency Checker</h1>
        <p className="text-muted mb-8">Maintain the same character voice from page 1 to page 40.</p>
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Project Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted block mb-1.5">Project Name</label>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., The Dragon's Keep Audiobook"
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Character Name</label>
              <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g., Elder Thorne"
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
            </div>
            <button onClick={handleSetup} disabled={!projectName.trim() || !characterName.trim()}
              className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Start Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{characterName}</h1>
          <p className="text-muted">{projectName}</p>
        </div>
        <div className="flex items-center gap-3">
          {profileEstablished && (
            <button onClick={saveProfile} className="bg-success/15 text-success hover:bg-success/25 font-medium px-5 py-2 rounded-lg text-sm transition-colors border border-success/30">
              {savedToDb ? "Saved" : "Save Profile"}
            </button>
          )}
          <button onClick={() => { setIsSetUp(false); setProfileEstablished(false); setSessions([]); setReferenceLines(DEFAULT_REFERENCE_LINES.map((l) => ({ ...l, recorded: false, blob: null, playbackUrl: null }))); setProfileId(null); }}
            className="text-sm text-muted hover:text-foreground transition-colors">
            New Project
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Reference Lines */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Reference Lines</h2>
              <span className="text-xs text-muted">{referenceLines.filter((l) => l.recorded).length}/3 recorded</span>
            </div>
            <div className="space-y-3">
              {referenceLines.map((line, idx) => (
                <div key={line.id} className={`rounded-xl p-4 border ${line.recorded ? "bg-success/5 border-success/20" : "bg-surface-light border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${line.recorded ? "bg-success text-white" : "bg-surface-light text-muted border border-border"}`}>
                          {line.recorded ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (idx + 1)}
                        </span>
                        <span className="text-xs text-muted">Line {idx + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed">&ldquo;{line.text}&rdquo;</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {line.recorded && (
                        <button onClick={() => playReference(line)} className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                          </svg>
                          Play
                        </button>
                      )}
                      <button onClick={() => handleRecordReference(line.id)}
                        className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          isRecordingRef === line.id ? "bg-danger text-white animate-pulse" :
                          line.recorded ? "bg-surface hover:bg-border text-muted" : "bg-accent hover:bg-accent-dark text-white"
                        }`}>
                        {isRecordingRef === line.id ? "Stop" : line.recorded ? "Re-record" : "Record"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Profile & Comparison */}
          {profileEstablished && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Voice Profile: {characterName}</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-surface-light rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-accent-light">{voiceProfile.pitchCenter} Hz</div>
                  <div className="text-xs text-muted mt-1">Pitch Center</div>
                </div>
                <div className="bg-surface-light rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-accent-light">{voiceProfile.tempo} WPM</div>
                  <div className="text-xs text-muted mt-1">Tempo</div>
                </div>
                <div className="bg-surface-light rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-accent-light">{voiceProfile.resonance}</div>
                  <div className="text-xs text-muted mt-1">Resonance</div>
                </div>
              </div>

              {/* Comparison Chart */}
              {sessions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Pitch Deviation Over Sessions</h3>
                  <canvas ref={comparisonCanvasRef} width={600} height={180} className="w-full h-44 rounded-xl bg-surface-light" />
                  <div className="flex gap-4 mt-2 text-xs text-muted">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Consistent</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Drifting</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" /> Off-Character</span>
                    <span className="flex items-center gap-1 ml-2">--- Reference Pitch</span>
                  </div>
                </div>
              )}

              {/* Record New Session */}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-4">New Session Check</h3>
                <div className="flex items-center gap-4">
                  <button onClick={handleRecordSession}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      isRecordingSession ? "bg-danger text-white animate-pulse" : "bg-accent hover:bg-accent-dark text-white"
                    }`}>
                    {isRecordingSession ? "Stop Recording" : "Record Session Check"}
                  </button>
                  {currentSessionScore !== null && (
                    <div className={`border rounded-xl px-5 py-3 ${scoreBadge(currentSessionScore)}`}>
                      <span className="text-sm font-medium">{scoreLabel(currentSessionScore)}: </span>
                      <span className={`text-xl font-bold ${scoreColor(currentSessionScore)}`}>{currentSessionScore}%</span>
                    </div>
                  )}
                </div>
                {currentSessionScore !== null && sessions.length > 0 && (
                  <div className="mt-3 text-xs text-muted">
                    Pitch: {sessions[sessions.length - 1].pitchHz} Hz (drift: {sessions[sessions.length - 1].pitchDrift}%) |
                    Tempo drift: {sessions[sessions.length - 1].tempoDrift}%
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Session History */}
        <div className="space-y-4">
          {profileEstablished && (
            <>
              {sessions.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-5 text-center">
                  <div className="text-sm text-muted mb-1">Average Consistency</div>
                  <div className={`text-4xl font-bold ${scoreColor(Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length))}`}>
                    {Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length)}%
                  </div>
                  <div className="text-xs text-muted mt-1">{sessions.length} sessions</div>
                </div>
              )}

              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3">Session History</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {[...sessions].reverse().map((session) => (
                    <div key={session.id} className={`rounded-lg px-3 py-2.5 border ${scoreBadge(session.score)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Session {session.sessionNumber}</span>
                        <span className={`text-lg font-bold ${scoreColor(session.score)}`}>{session.score}%</span>
                      </div>
                      <div className="flex gap-3 text-xs opacity-70">
                        <span>{session.date}</span>
                        <span>{session.pitchHz} Hz</span>
                        <span>P: +/-{session.pitchDrift}%</span>
                        <span>T: +/-{session.tempoDrift}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3">Score Guide</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-success" /><span className="text-success font-medium">90%+</span><span className="text-muted">Consistent</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning" /><span className="text-warning font-medium">70-89%</span><span className="text-muted">Drifting</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-danger" /><span className="text-danger font-medium">&lt;70%</span><span className="text-muted">Off-Character</span></div>
                </div>
              </div>
            </>
          )}

          {!profileEstablished && !allRefsRecorded && (
            <div className="bg-surface border border-border rounded-xl p-5 text-center text-muted text-sm">
              Record all 3 reference lines to establish {characterName}&apos;s voice profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
