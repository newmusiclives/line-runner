"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BrowserVoiceEngine } from "@/lib/voice-engine";
import { detectAllEmotions, getEmotionVoiceAdjustment, EMOTION_COLORS } from "@/lib/ai/emotion-detector";
import { generateDirectorNotes } from "@/lib/ai/director-notes";
import { generatePerformanceNotes } from "@/lib/ai/performance-coach";
import { analyzeScript } from "@/lib/ai/script-analyzer";
import { WILDCARD_MODIFIERS } from "@/types";
import type { RehearsalSession, ScriptLine, VoiceAssignment, EmotionTag, PerformanceNote, ScriptAnalysis, SubtextConfig, ObjectiveObstacle, RelationshipDynamic, EmotionalArcPoint, LineMetric, WildcardModifier } from "@/types";
import type { DirectorNote } from "@/lib/ai/director-notes";
import ModeSelector from "@/components/rehearsal/ModeSelector";
import type { RehearsalMode } from "@/components/rehearsal/ModeSelector";
import PerformanceCoachPanel from "@/components/rehearsal/PerformanceCoachPanel";
import ScriptAnalysisPanel from "@/components/rehearsal/ScriptAnalysisPanel";
import LineMemoryTracker from "@/components/rehearsal/LineMemoryTracker";
import SubtextMode from "@/components/rehearsal/SubtextMode";
import ObjectiveObstaclePanel from "@/components/rehearsal/ObjectiveObstaclePanel";
import RelationshipDynamicsPanel from "@/components/rehearsal/RelationshipDynamicsPanel";
import EmotionalArcChart from "@/components/rehearsal/EmotionalArcChart";
import PreAuditionRitual from "@/components/rehearsal/PreAuditionRitual";

export default function RehearsePage() {
  const router = useRouter();
  const [session, setSession] = useState<RehearsalSession | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [pauseDuration, setPauseDuration] = useState(3);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const voiceEngineRef = useRef<BrowserVoiceEngine | null>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);

  // Feature states
  const [mode, setMode] = useState<RehearsalMode>("standard");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showMemoryTracker, setShowMemoryTracker] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [showObjective, setShowObjective] = useState(false);
  const [showRelationship, setShowRelationship] = useState(false);
  const [showEmotionalArc, setShowEmotionalArc] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  // Feature data
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [emotions, setEmotions] = useState<Map<string, EmotionTag>>(new Map());
  const [directorNotes, setDirectorNotes] = useState<DirectorNote[]>([]);
  const [coachNotes, setCoachNotes] = useState<PerformanceNote[]>([]);
  const [lineMetrics, setLineMetrics] = useState<LineMetric[]>([]);
  const [arcPoints, setArcPoints] = useState<EmotionalArcPoint[]>([]);
  const [subtextConfigs, setSubtextConfigs] = useState<SubtextConfig[]>([]);
  const [objectiveConfigs, setObjectiveConfigs] = useState<ObjectiveObstacle[]>([]);
  const [relationshipConfigs, setRelationshipConfigs] = useState<RelationshipDynamic[]>([]);
  const [wildcardModifier, setWildcardModifier] = useState<WildcardModifier | null>(null);
  const [sceneComplete, setSceneComplete] = useState(false);
  const lineStartTimeRef = useRef(0);

  // Stumble tracking (Feature 05)
  const [stumbleData] = useState<Map<string, { lineId: string; count: number; severity: "clean" | "amber" | "red" }>>(new Map());

  useEffect(() => {
    const data = sessionStorage.getItem("rehearsal-session");
    if (data) {
      const parsed = JSON.parse(data) as RehearsalSession;
      setSession(parsed);
      // Run analysis on load (Feature 04)
      const a = analyzeScript(parsed.script.lines, parsed.script.characters);
      setAnalysis(a);
      // Detect emotions for all lines
      const emo = detectAllEmotions(parsed.script.lines);
      setEmotions(emo);
      // Generate director notes
      const dn = generateDirectorNotes(parsed.script.lines, emo, parsed.myCharacter);
      setDirectorNotes(dn);
    } else {
      router.push("/upload");
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      voiceEngineRef.current = new BrowserVoiceEngine();
    }
    return () => { voiceEngineRef.current?.stop(); };
  }, []);

  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex]);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const getVoiceForCharacter = useCallback((characterName: string): VoiceAssignment | undefined => {
    return session?.voiceAssignments.find((va) => va.characterName === characterName);
  }, [session]);

  const dialogueLines = session?.script.lines.filter((l) => l.type === "dialogue") || [];

  const advanceLine = useCallback(() => {
    if (!session) return;
    // Record timing metric
    if (lineStartTimeRef.current > 0) {
      const timingMs = Date.now() - lineStartTimeRef.current;
      const currentLine = dialogueLines[currentLineIndex];
      if (currentLine) {
        setLineMetrics((prev) => [...prev, {
          lineId: currentLine.id, lineIndex: currentLineIndex,
          characterName: currentLine.character || "", timingMs, skipped: false, replayed: false,
        }]);
        // Emotional arc point
        const emo = emotions.get(currentLine.id);
        if (emo) {
          setArcPoints((prev) => [...prev, {
            lineIndex: currentLineIndex, lineId: currentLine.id,
            character: currentLine.character || "", intensity: emo.confidence,
            emotion: emo.emotion, timestamp: Date.now(),
          }]);
        }
      }
    }

    setCurrentLineIndex((prev) => {
      const next = prev + 1;
      if (next >= dialogueLines.length) {
        setIsPlaying(false);
        setSceneComplete(true);
        // Generate coach notes (Feature 01)
        if (lineMetrics.length > 0 && session) {
          const notes = generatePerformanceNotes(session.script.lines, lineMetrics, emotions, session.myCharacter, session.id);
          setCoachNotes(notes);
          setShowCoach(true);
        }
        return prev;
      }
      lineStartTimeRef.current = Date.now();
      return next;
    });
  }, [session, dialogueLines, currentLineIndex, lineMetrics, emotions]);

  const speakLine = useCallback((line: ScriptLine) => {
    if (!voiceEngineRef.current || !line.character) return;
    const assignment = getVoiceForCharacter(line.character);
    if (!assignment) return;

    // Apply emotion-based voice adjustment
    const emo = emotions.get(line.id);
    let adjustedAssignment = { ...assignment };
    if (emo) {
      const adj = getEmotionVoiceAdjustment(emo);
      adjustedAssignment = { ...assignment, pitch: assignment.pitch + adj.pitchDelta, rate: assignment.rate + adj.rateDelta };
    }

    // Apply wildcard modifier (Feature 08)
    if (mode === "wildcard" && wildcardModifier) {
      const modifierAdjustments: Record<string, { pitchDelta: number; rateDelta: number }> = {
        distracted: { pitchDelta: -0.05, rateDelta: 0.15 },
        urgent: { pitchDelta: 0.15, rateDelta: 0.25 },
        playful: { pitchDelta: 0.1, rateDelta: 0.1 },
        cold: { pitchDelta: -0.1, rateDelta: -0.15 },
        "barely holding it together": { pitchDelta: 0.2, rateDelta: -0.1 },
        contemptuous: { pitchDelta: -0.15, rateDelta: -0.1 },
        tender: { pitchDelta: -0.05, rateDelta: -0.2 },
        afraid: { pitchDelta: 0.15, rateDelta: 0.1 },
        exhausted: { pitchDelta: -0.2, rateDelta: -0.25 },
        manic: { pitchDelta: 0.2, rateDelta: 0.3 },
        seductive: { pitchDelta: -0.1, rateDelta: -0.2 },
        bored: { pitchDelta: -0.15, rateDelta: -0.1 },
      };
      const modAdj = modifierAdjustments[wildcardModifier] || { pitchDelta: 0, rateDelta: 0 };
      adjustedAssignment = { ...adjustedAssignment, pitch: adjustedAssignment.pitch + modAdj.pitchDelta, rate: adjustedAssignment.rate + modAdj.rateDelta };
    }

    voiceEngineRef.current.speak(line.text, adjustedAssignment, () => {
      if (isPlayingRef.current) advanceLine();
    });
  }, [getVoiceForCharacter, advanceLine, emotions, mode, wildcardModifier]);

  // Handle line changes during playback
  useEffect(() => {
    if (!session || !isPlaying) return;
    const currentLine = dialogueLines[currentLineIndex];
    if (!currentLine) return;

    if (currentLine.character === session.myCharacter) {
      setWaitingForUser(true);
      voiceEngineRef.current?.stop();
      lineStartTimeRef.current = Date.now();
      if (autoAdvance) {
        const timeout = setTimeout(() => { setWaitingForUser(false); advanceLine(); }, pauseDuration * 1000);
        return () => clearTimeout(timeout);
      }
    } else {
      setWaitingForUser(false);
      lineStartTimeRef.current = Date.now();
      speakLine(currentLine);
    }
  }, [currentLineIndex, isPlaying, session, autoAdvance, pauseDuration, speakLine, advanceLine, dialogueLines]);

  const togglePlay = () => {
    if (isPlaying) {
      voiceEngineRef.current?.stop();
      setIsPlaying(false);
    } else {
      // Wildcard: pick random modifier (Feature 08)
      if (mode === "wildcard") {
        const available = WILDCARD_MODIFIERS.filter((m) => m !== wildcardModifier);
        setWildcardModifier(available[Math.floor(Math.random() * available.length)]);
      }
      lineStartTimeRef.current = Date.now();
      setSceneComplete(false);
      setIsPlaying(true);
    }
  };

  const skipLine = () => { voiceEngineRef.current?.stop(); setWaitingForUser(false); advanceLine(); };
  const goBack = () => { voiceEngineRef.current?.stop(); setWaitingForUser(false); setCurrentLineIndex((prev) => Math.max(0, prev - 1)); };
  const restart = () => {
    voiceEngineRef.current?.stop(); setWaitingForUser(false); setCurrentLineIndex(0);
    setIsPlaying(false); setSceneComplete(false); setLineMetrics([]); setArcPoints([]);
    if (mode === "wildcard") setWildcardModifier(null);
  };

  const handleModeChange = (newMode: RehearsalMode) => {
    setMode(newMode);
    restart();
    if (newMode === "teleprompter" && session) { router.push(`/rehearse/${session.id}/teleprompter`); }
  };

  if (!session) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>;
  }

  // Ritual mode check
  if (showRitual) {
    return <PreAuditionRitual onComplete={() => { setShowRitual(false); setIsPlaying(true); lineStartTimeRef.current = Date.now(); }} onSkip={() => setShowRitual(false)} />;
  }

  const progress = dialogueLines.length > 0 ? ((currentLineIndex + 1) / dialogueLines.length) * 100 : 0;
  const characterNames = session.script.characters.map((c) => c.name);
  const currentLine = dialogueLines[currentLineIndex];
  const currentDirectorNote = currentLine ? directorNotes.find((n) => n.lineId === currentLine.id) : null;
  const currentSubtext = currentLine?.character ? subtextConfigs.find((s) => s.characterName === currentLine.character) : null;

  // Cold read mode: only show current and previous lines (Feature 10)
  const isColdRead = mode === "cold-read";
  // Sleep learning mode: slow auto-advance
  const isSleepMode = mode === "sleep-learning";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header Bar */}
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{session.script.title}</h1>
            <p className="text-sm text-muted">
              Playing as <span className="text-success font-medium">{session.myCharacter}</span>
              {" "}&middot; Line {currentLineIndex + 1} of {dialogueLines.length}
              {mode !== "standard" && <span className="ml-2 text-accent-light capitalize">({mode.replace("-", " ")})</span>}
              {wildcardModifier && mode === "wildcard" && sceneComplete && <span className="ml-2 text-warning">Modifier: {wildcardModifier}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="accent-accent" />
                Auto
              </label>
              {autoAdvance && (
                <select value={pauseDuration} onChange={(e) => setPauseDuration(parseInt(e.target.value))} className="bg-surface-light border border-border rounded px-2 py-1 text-xs">
                  <option value={2}>2s</option><option value={3}>3s</option><option value={5}>5s</option><option value={8}>8s</option><option value={10}>10s</option>
                  {isSleepMode && <><option value={15}>15s</option><option value={20}>20s</option></>}
                </select>
              )}
            </div>
            <button onClick={() => setShowModeSelector(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors text-muted hover:text-foreground">
              Mode
            </button>
            <button onClick={() => router.push("/upload")} className="text-xs text-muted hover:text-foreground">New Script</button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2">
          <div className="h-1 bg-surface-light rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Feature Toolbar */}
      {showToolbar && (
        <div className="bg-surface/50 border-b border-border px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto">
            <button onClick={() => analysis && setShowAnalysis(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" title="Script Analysis">
              Analysis
            </button>
            <button onClick={() => setShowMemoryTracker(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" title="Line Memory">
              Memory
            </button>
            <button onClick={() => setShowSubtext(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" title="Subtext Mode">
              Subtext {subtextConfigs.length > 0 && <span className="ml-1 w-1.5 h-1.5 bg-accent rounded-full inline-block" />}
            </button>
            <button onClick={() => setShowObjective(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" title="Objective & Obstacle">
              Objective {objectiveConfigs.length > 0 && <span className="ml-1 w-1.5 h-1.5 bg-accent rounded-full inline-block" />}
            </button>
            <button onClick={() => setShowRelationship(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" title="Relationship Dynamics">
              Dynamics {relationshipConfigs.length > 0 && <span className="ml-1 w-1.5 h-1.5 bg-accent rounded-full inline-block" />}
            </button>
            <button onClick={() => { if (arcPoints.length > 0) setShowEmotionalArc(true); }} className={`text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${arcPoints.length === 0 ? "opacity-50" : ""}`} title="Emotional Arc">
              Arc
            </button>
            <button onClick={() => setShowRitual(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" title="Pre-Audition Ritual">
              Ritual
            </button>
            <div className="flex-1" />
            <button onClick={() => setShowToolbar(false)} className="text-xs text-muted hover:text-foreground">Hide</button>
          </div>
        </div>
      )}
      {!showToolbar && (
        <button onClick={() => setShowToolbar(true)} className="absolute right-4 top-28 z-10 text-xs bg-surface border border-border px-2 py-1 rounded-lg text-muted hover:text-foreground">
          Tools
        </button>
      )}

      {/* Script View */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          {dialogueLines.map((line, index) => {
            const isCurrentLine = index === currentLineIndex;
            const isMyLine = line.character === session.myCharacter;
            const isDone = index < currentLineIndex;
            const emotion = emotions.get(line.id);
            const dirNote = directorNotes.find((n) => n.lineId === line.id);
            const lineSubtext = line.character ? subtextConfigs.find((s) => s.characterName === line.character) : null;

            // Cold Read: hide future lines (Feature 10)
            if (isColdRead && index > currentLineIndex) return null;

            return (
              <div
                key={line.id}
                ref={isCurrentLine ? currentLineRef : undefined}
                className={`rounded-xl p-4 transition-all cursor-pointer ${
                  isCurrentLine ? (isMyLine ? "line-my-turn" : "line-active") : isDone ? "line-done" : ""
                } ${lineSubtext ? "subtext-active" : ""} hover:bg-surface-light/50`}
                onClick={() => { voiceEngineRef.current?.stop(); setCurrentLineIndex(index); }}
              >
                <div className="flex items-start gap-3">
                  {/* Emotion dot */}
                  {emotion && emotion.emotion !== "neutral" && (
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: EMOTION_COLORS[emotion.emotion] }} title={emotion.emotion} />
                  )}
                  <div className={`text-sm font-bold uppercase tracking-wide pt-0.5 w-24 shrink-0 ${isMyLine ? "text-success" : "text-accent-light"}`}>
                    {line.character}
                    {isMyLine && <span className="block text-xs font-normal opacity-70 normal-case">(You)</span>}
                  </div>
                  <div className="flex-1">
                    <p className={`text-base leading-relaxed ${isDone ? "text-muted" : "text-foreground"}`}>
                      {line.text}
                    </p>
                    {/* Subtext indicator */}
                    {lineSubtext && (
                      <p className="text-xs text-pink-400 mt-1 italic">Subtext: {lineSubtext.subtextTag}</p>
                    )}
                    {/* Director note */}
                    {isCurrentLine && dirNote && (
                      <div className="mt-2 bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 text-xs text-muted">
                        <span className="text-accent-light font-medium uppercase tracking-wide text-[10px]">{dirNote.category}</span>
                        <p className="mt-0.5">{dirNote.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>

                {isCurrentLine && isMyLine && waitingForUser && (
                  <div className="mt-3 ml-9 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-success">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Your line — speak now
                    </div>
                    {!autoAdvance && (
                      <button onClick={(e) => { e.stopPropagation(); setWaitingForUser(false); advanceLine(); }} className="text-sm bg-success/20 text-success px-3 py-1 rounded-full hover:bg-success/30 transition-colors">
                        Done
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Scene Complete */}
          {sceneComplete && (
            <div className="text-center py-12">
              <div className="text-2xl font-bold mb-2">Scene Complete!</div>
              {wildcardModifier && mode === "wildcard" && (
                <div className="mb-4 wildcard-reveal">
                  <span className="inline-block bg-warning/15 text-warning text-sm font-medium px-4 py-2 rounded-full">
                    Wildcard modifier: <span className="font-bold">{wildcardModifier}</span>
                  </span>
                </div>
              )}
              <p className="text-muted mb-6">Great rehearsal. The AI Performance Coach has notes for you.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => { if (coachNotes.length > 0) setShowCoach(true); else restart(); }} className="bg-accent hover:bg-accent-dark text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
                  {coachNotes.length > 0 ? "View Coach Notes" : "Run Again"}
                </button>
                <button onClick={() => { if (arcPoints.length > 0) setShowEmotionalArc(true); }} className="bg-surface-light hover:bg-border text-foreground font-medium px-6 py-2.5 rounded-xl transition-colors" disabled={arcPoints.length === 0}>
                  View Emotional Arc
                </button>
                <button onClick={restart} className="text-sm text-muted hover:text-foreground">Restart</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-surface border-t border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
          <button onClick={restart} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors" title="Restart">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          </button>
          <button onClick={goBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors" title="Previous"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
          <button onClick={togglePlay} className="w-14 h-14 flex items-center justify-center rounded-full bg-accent hover:bg-accent-dark transition-colors shadow-lg shadow-accent/25" title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
            ) : (
              <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" /></svg>
            )}
          </button>
          <button onClick={skipLine} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors" title="Next"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>
          <button onClick={() => voiceEngineRef.current?.stop()} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors" title="Stop voice"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg></button>
        </div>
      </div>

      {/* Modals */}
      {showModeSelector && <ModeSelector currentMode={mode} onSelectMode={handleModeChange} onClose={() => setShowModeSelector(false)} />}
      {showAnalysis && analysis && <ScriptAnalysisPanel analysis={analysis} onClose={() => setShowAnalysis(false)} />}
      {showCoach && <PerformanceCoachPanel notes={coachNotes} onClose={() => setShowCoach(false)} onJumpToLine={(i) => { setCurrentLineIndex(i); setShowCoach(false); }} />}
      {showMemoryTracker && <LineMemoryTracker lines={session.script.lines} myCharacter={session.myCharacter} stumbleData={stumbleData} onStartDrill={() => { setShowMemoryTracker(false); restart(); }} onClose={() => setShowMemoryTracker(false)} />}
      {showSubtext && <SubtextMode characters={characterNames} myCharacter={session.myCharacter} currentConfigs={subtextConfigs} onApply={setSubtextConfigs} onClose={() => setShowSubtext(false)} />}
      {showObjective && <ObjectiveObstaclePanel characters={characterNames} myCharacter={session.myCharacter} current={objectiveConfigs} onApply={setObjectiveConfigs} onClose={() => setShowObjective(false)} />}
      {showRelationship && <RelationshipDynamicsPanel characters={characterNames} myCharacter={session.myCharacter} current={relationshipConfigs} onApply={setRelationshipConfigs} onClose={() => setShowRelationship(false)} />}
      {showEmotionalArc && <EmotionalArcChart points={arcPoints} onTapPoint={(i) => { setCurrentLineIndex(i); setShowEmotionalArc(false); }} onClose={() => setShowEmotionalArc(false)} />}
    </div>
  );
}
