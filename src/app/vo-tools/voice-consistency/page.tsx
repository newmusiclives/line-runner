"use client";

import { useState } from "react";

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
  pitchDrift: number;
  tempoDrift: number;
  notes: string;
}

interface ReferenceLine {
  id: string;
  text: string;
  recorded: boolean;
}

const DEFAULT_REFERENCE_LINES: ReferenceLine[] = [
  { id: "r1", text: "The ancient oak stood sentinel at the crossroads, its branches reaching toward a sky the color of old pewter.", recorded: false },
  { id: "r2", text: "Listen closely, traveler, for these words carry the weight of a thousand winters and the promise of spring.", recorded: false },
  { id: "r3", text: "In the kingdom of Ashenvale, there was only one rule that mattered: never trust the silence.", recorded: false },
];

const MOCK_SESSIONS: SessionScore[] = [
  { id: "s1", sessionNumber: 1, score: 95, date: "2026-03-20", pitchDrift: 2, tempoDrift: 3, notes: "Baseline established" },
  { id: "s2", sessionNumber: 2, score: 88, date: "2026-03-22", pitchDrift: 5, tempoDrift: 8, notes: "Slight tempo increase" },
  { id: "s3", sessionNumber: 3, score: 72, date: "2026-03-24", pitchDrift: 12, tempoDrift: 15, notes: "Morning session - lower energy" },
  { id: "s4", sessionNumber: 4, score: 91, date: "2026-03-26", pitchDrift: 4, tempoDrift: 5, notes: "Back on target" },
  { id: "s5", sessionNumber: 5, score: 94, date: "2026-03-28", pitchDrift: 3, tempoDrift: 2, notes: "Strongest consistency yet" },
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

  const [voiceProfile] = useState<VoiceProfile>({
    pitchCenter: 142,
    tempo: 165,
    resonance: "Mid-chest",
  });

  const allRefsRecorded = referenceLines.every((l) => l.recorded);

  const handleSetup = () => {
    if (!projectName.trim() || !characterName.trim()) return;
    setIsSetUp(true);
  };

  const handleRecordReference = (lineId: string) => {
    if (isRecordingRef === lineId) {
      setIsRecordingRef(null);
      setReferenceLines((prev) =>
        prev.map((l) => (l.id === lineId ? { ...l, recorded: true } : l))
      );
      // If all recorded, establish profile
      const willAllBeRecorded = referenceLines.filter((l) => l.id !== lineId).every((l) => l.recorded);
      if (willAllBeRecorded) {
        setTimeout(() => {
          setProfileEstablished(true);
          setSessions(MOCK_SESSIONS);
        }, 500);
      }
    } else {
      setIsRecordingRef(lineId);
    }
  };

  const handleRecordSession = () => {
    if (isRecordingSession) {
      setIsRecordingSession(false);
      const score = Math.round(65 + Math.random() * 32);
      setCurrentSessionScore(score);
      const newSession: SessionScore = {
        id: `s-${Date.now()}`,
        sessionNumber: sessions.length + 1,
        score,
        date: new Date().toISOString().split("T")[0],
        pitchDrift: Math.round(Math.random() * 15),
        tempoDrift: Math.round(Math.random() * 15),
        notes: "",
      };
      setSessions((prev) => [...prev, newSession]);
    } else {
      setIsRecordingSession(true);
      setCurrentSessionScore(null);
    }
  };

  // Project Setup Screen
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
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., The Dragon's Keep Audiobook"
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Character Name</label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g., Elder Thorne"
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleSetup}
              disabled={!projectName.trim() || !characterName.trim()}
              className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
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
        <button
          onClick={() => { setIsSetUp(false); setProfileEstablished(false); setSessions([]); setReferenceLines(DEFAULT_REFERENCE_LINES.map((l) => ({ ...l, recorded: false }))); }}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          New Project
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: References & Profile */}
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
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <span className="text-xs text-muted">Line {idx + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed">&ldquo;{line.text}&rdquo;</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {line.recorded && (
                        <button className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                          </svg>
                          Play
                        </button>
                      )}
                      <button
                        onClick={() => handleRecordReference(line.id)}
                        className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          isRecordingRef === line.id
                            ? "bg-danger text-white animate-pulse"
                            : line.recorded
                            ? "bg-surface hover:bg-border text-muted"
                            : "bg-accent hover:bg-accent-dark text-white"
                        }`}
                      >
                        {isRecordingRef === line.id ? "Stop" : line.recorded ? "Re-record" : "Record"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Profile */}
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

              {/* Record New Session */}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-4">New Session Check</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRecordSession}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      isRecordingSession
                        ? "bg-danger text-white animate-pulse"
                        : "bg-accent hover:bg-accent-dark text-white"
                    }`}
                  >
                    {isRecordingSession ? "Stop Recording" : "Record Session Check"}
                  </button>
                  {currentSessionScore !== null && (
                    <div className={`border rounded-xl px-5 py-3 ${scoreBadge(currentSessionScore)}`}>
                      <span className="text-sm font-medium">{scoreLabel(currentSessionScore)}: </span>
                      <span className={`text-xl font-bold ${scoreColor(currentSessionScore)}`}>{currentSessionScore}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Session History */}
        <div className="space-y-4">
          {profileEstablished && (
            <>
              {/* Average Score */}
              {sessions.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-5 text-center">
                  <div className="text-sm text-muted mb-1">Average Consistency</div>
                  <div className={`text-4xl font-bold ${scoreColor(Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length))}`}>
                    {Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length)}%
                  </div>
                  <div className="text-xs text-muted mt-1">{sessions.length} sessions</div>
                </div>
              )}

              {/* Session History */}
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
                        <span>Pitch: +/-{session.pitchDrift}%</span>
                        <span>Tempo: +/-{session.tempoDrift}%</span>
                      </div>
                      {session.notes && <p className="text-xs opacity-60 mt-1">{session.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3">Score Guide</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-success font-medium">90%+</span>
                    <span className="text-muted">Consistent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-warning font-medium">70-89%</span>
                    <span className="text-muted">Drifting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger" />
                    <span className="text-danger font-medium">&lt;70%</span>
                    <span className="text-muted">Off-Character</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!profileEstablished && allRefsRecorded && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 text-center">
              <div className="text-sm text-accent-light">Building voice profile...</div>
            </div>
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
