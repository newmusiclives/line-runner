"use client";

import { useState, useEffect, useMemo, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { BrowserVoiceEngine, GeminiVoiceEngine, DemoVoiceEngine, createVoiceEngine } from "@/lib/voice-engine";
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

// Mode components
import MemorizationMode from "@/components/rehearsal/MemorizationMode";
import MonologueMode from "@/components/rehearsal/MonologueMode";
import SpeedRunMode from "@/components/rehearsal/SpeedRunMode";
import CueOnlyMode from "@/components/rehearsal/CueOnlyMode";
import TeleprompterMode from "@/components/rehearsal/TeleprompterMode";
import BackstageMode from "@/components/rehearsal/BackstageMode";
import ColdReadMode from "@/components/rehearsal/ColdReadMode";
import WildcardMode from "@/components/rehearsal/WildcardMode";
import SubtextModeView from "@/components/rehearsal/SubtextModeView";
import SleepLearningMode from "@/components/rehearsal/SleepLearningMode";

// Control components
import PlaybackControls from "@/components/rehearsal/PlaybackControls";
import TimingControls from "@/components/rehearsal/TimingControls";
import type { TimingSettings } from "@/components/rehearsal/TimingControls";
import RemoteControlPanel from "@/components/rehearsal/RemoteControlPanel";
import { useLineListener } from "@/hooks/useLineListener";

export default function RehearsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: routeId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<RehearsalSession | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const voiceEngineRef = useRef<BrowserVoiceEngine | GeminiVoiceEngine | DemoVoiceEngine | null>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  // The line index whose audio has actually started speaking, and a live
  // mirror of currentLineIndex. Together these let handleResume tell "paused
  // mid-audio" (continue the audio) from "paused during the pre-line beat,
  // before any audio started" (re-arm the line so it isn't stranded).
  const spokenIndexRef = useRef(-1);
  const currentIndexRef = useRef(0);
  // Pending "beat" before an AI line speaks. Held in a ref (not torn down by
  // effect cleanup) so a harmless same-line effect re-run — e.g. the user
  // nudging a Timing slider during the beat — can't strand the line. Cleared
  // explicitly on real line changes, stop, pause, skip and unmount.
  const beatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timing settings
  const [timingSettings, setTimingSettings] = useState<TimingSettings>({
    pauseDuration: 2,
    playbackSpeed: 1.0,
    listenMode: true,
    matchThreshold: 0.85,
    silenceMs: 2200,
  });

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
  const [showTimingControls, setShowTimingControls] = useState(false);
  const [showRemotePanel, setShowRemotePanel] = useState(false);

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

  // Speed run score
  const [speedRunScore, setSpeedRunScore] = useState<{ averageTime: number; fastest: number; slowest: number; linesUnder2s: number; totalLines: number; times: number[] } | null>(null);

  // Stumble tracking
  const [stumbleData] = useState<Map<string, { lineId: string; count: number; severity: "clean" | "amber" | "red" }>>(new Map());

  // BroadcastChannel for remote control
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCommandTimestampRef = useRef(0);

  useEffect(() => {
    const data = sessionStorage.getItem("rehearsal-session");
    if (data) {
      const parsed = JSON.parse(data) as RehearsalSession;
      // Stale session for a different script — restart character/voice flow
      if (parsed.id !== routeId) {
        router.replace(`/upload?scriptId=${routeId}`);
        return;
      }
      setSession(parsed);
      const a = analyzeScript(parsed.script.lines, parsed.script.characters);
      setAnalysis(a);
      const emo = detectAllEmotions(parsed.script.lines);
      setEmotions(emo);
      const dn = generateDirectorNotes(parsed.script.lines, emo, parsed.myCharacter);
      setDirectorNotes(dn);
    } else {
      // Deep-link / reload with no session — send through upload to pick character + voices
      router.replace(`/upload?scriptId=${routeId}`);
    }
  }, [router, routeId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const demoSceneId = routeId.startsWith("demo-")
        ? routeId.slice("demo-".length)
        : undefined;
      createVoiceEngine({ demoSceneId }).then((engine) => {
        voiceEngineRef.current = engine;
      });
    }
    return () => { voiceEngineRef.current?.stop(); };
  }, [routeId]);

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex]);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { currentIndexRef.current = currentLineIndex; }, [currentLineIndex]);

  const clearBeat = useCallback(() => {
    if (beatTimerRef.current) {
      clearTimeout(beatTimerRef.current);
      beatTimerRef.current = null;
    }
  }, []);

  // Safety net: clear any pending beat when the component unmounts.
  useEffect(() => clearBeat, [clearBeat]);

  // Use a ref for the remote command handler to avoid stale closures
  const remoteCommandRef = useRef<(command: string) => void>(() => {});

  // BroadcastChannel listener for remote control
  useEffect(() => {
    if (!session) return;

    try {
      const bc = new BroadcastChannel(`rehearsal-${session.id}`);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data.type === "command") {
          remoteCommandRef.current(event.data.command);
        }
        if (event.data.type === "request-status") {
          bc.postMessage({
            type: "status",
            isPlaying: isPlayingRef.current,
            isPaused: isPausedRef.current,
          });
        }
      };

      return () => bc.close();
    } catch {
      // BroadcastChannel not available
    }
  }, [session]);

  // Polling for remote control commands (cross-device)
  useEffect(() => {
    if (!session) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/rehearsals/${session.id}/control?since=${lastCommandTimestampRef.current}`);
        if (res.ok) {
          const data = await res.json();
          if (data.command && data.timestamp > lastCommandTimestampRef.current) {
            lastCommandTimestampRef.current = data.timestamp;
            remoteCommandRef.current(data.command);
          }
        }
      } catch {
        // Silently fail
      }
    }, 1000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [session]);

  const getVoiceForCharacter = useCallback((characterName: string): VoiceAssignment | undefined => {
    return session?.voiceAssignments.find((va) => va.characterName === characterName);
  }, [session]);

  const dialogueLines = useMemo(
    () => session?.script.lines.filter((l) => l.type === "dialogue") ?? [],
    [session]
  );

  // Tracks the line index the line-change effect has already set up (TTS or
  // listener). Without this, dep changes that don't actually change the
  // current line cause speakLine() to fire again, queueing duplicate
  // utterances whose later cancellation triggers phantom advanceLine() calls.
  const lastSetupIndexRef = useRef(-1);

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
        setIsPaused(false);
        setSceneComplete(true);
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

    const emo = emotions.get(line.id);
    let adjustedAssignment = { ...assignment };
    if (emo) {
      const adj = getEmotionVoiceAdjustment(emo);
      adjustedAssignment = { ...assignment, pitch: assignment.pitch + adj.pitchDelta, rate: assignment.rate + adj.rateDelta };
    }

    // Apply wildcard modifier
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

    // Clamp the expressive rate (emotion + wildcard deltas) to a subtle band
    // before applying the user's chosen speed. On the Gemini/Demo engines rate
    // is an AudioBuffer playbackRate that shifts pitch as well as tempo, so
    // large expressive deltas detune the voice ("chipmunk"). Keep expression
    // subtle; the user's playbackSpeed (0.5–2.0) still multiplies on top.
    const expressiveRate = Math.min(1.25, Math.max(0.8, adjustedAssignment.rate));
    adjustedAssignment = { ...adjustedAssignment, rate: expressiveRate * timingSettings.playbackSpeed };

    voiceEngineRef.current.speak(line.text, adjustedAssignment, () => {
      if (isPlayingRef.current && !isPausedRef.current) advanceLine();
    });
  }, [getVoiceForCharacter, advanceLine, emotions, mode, wildcardModifier, timingSettings.playbackSpeed]);

  // ─── Mic listener for auto-advance on user lines ─────────────
  const advanceFromListener = useCallback(() => {
    if (isPausedRef.current) return;
    setWaitingForUser((wasWaiting) => {
      if (wasWaiting) advanceLine();
      return false;
    });
  }, [advanceLine]);

  const currentLineForListener = dialogueLines[currentLineIndex];
  const isMyLineNow =
    !!session && currentLineForListener?.character === session.myCharacter;
  const modeAllowsListener =
    mode !== "speed-run" && mode !== "sleep-learning" && mode !== "teleprompter";

  const lineListener = useLineListener({
    enabled:
      isMyLineNow &&
      waitingForUser &&
      timingSettings.listenMode &&
      isPlaying &&
      !isPaused &&
      modeAllowsListener,
    expectedText: isMyLineNow ? currentLineForListener?.text ?? "" : "",
    onMatch: advanceFromListener,
    onSilence: advanceFromListener,
    matchThreshold: timingSettings.matchThreshold,
    silenceMs: timingSettings.silenceMs,
  });

  // Handle line changes during playback
  useEffect(() => {
    if (!session || !isPlaying || isPaused) return;
    // Skip for modes that handle their own playback
    if (mode === "speed-run" || mode === "sleep-learning" || mode === "teleprompter") return;

    const currentLine = dialogueLines[currentLineIndex];
    if (!currentLine) return;

    // Re-running setup for the same line queues duplicate TTS utterances; the
    // later cancellation of those duplicates fires phantom end events that
    // skip lines. Only set up once per index transition.
    if (lastSetupIndexRef.current === currentLineIndex) return;
    lastSetupIndexRef.current = currentLineIndex;
    // Real line change — drop any beat still pending from the previous line.
    clearBeat();

    if (currentLine.character === session.myCharacter) {
      setWaitingForUser(true);
      voiceEngineRef.current?.stop();
      lineStartTimeRef.current = Date.now();

      // Prefetch the next AI line's TTS while the user is speaking. This
      // hides the /api/voice/tts round-trip (500ms–2s for Gemini) inside the
      // user's speaking window so Juliet responds immediately when the silence
      // timer fires, instead of feeling like she's still loading.
      const nextLine = dialogueLines[currentLineIndex + 1];
      if (nextLine && nextLine.character && nextLine.character !== session.myCharacter) {
        const nextVoice = getVoiceForCharacter(nextLine.character);
        if (nextVoice) {
          voiceEngineRef.current?.prefetch?.(nextLine.text, nextVoice.voiceId);
        }
      }

      // When listen-mode is on and supported, the mic listener triggers advance.
      // Fall back to fixed-pause timer otherwise (or wait for manual Done).
      const useListener = timingSettings.listenMode && lineListener.isSupported;
      if (autoAdvance && !useListener) {
        const timeout = setTimeout(() => {
          if (!isPausedRef.current) {
            setWaitingForUser(false);
            advanceLine();
          }
        }, timingSettings.pauseDuration * 1000);
        return () => clearTimeout(timeout);
      }
    } else {
      setWaitingForUser(false);
      lineStartTimeRef.current = Date.now();

      // Insert a natural beat before the AI partner speaks so lines don't run
      // together. When we've just come off the actor's own line they've
      // already had their pause (silence detection or the fixed timer), so
      // pick up quickly; the very first line of the scene leads in fast too.
      // Between consecutive AI lines, use the full "Pause Between Lines" gap so
      // multi-line passages breathe — this is what the Timing slider governs.
      const prevLine = dialogueLines[currentLineIndex - 1];
      const prevWasUser = !!prevLine && prevLine.character === session.myCharacter;
      const isFirstLine = currentLineIndex === 0;
      const beatMs = isFirstLine ? 400 : prevWasUser ? 350 : timingSettings.pauseDuration * 1000;

      // Backstage mode: always speak (that is its entire point)
      // Cue-only mode: speak but show minimal text (handled in component)
      // Held in beatTimerRef (see its declaration) so a same-line effect re-run
      // during the beat can't cancel the AI line and strand the scene.
      clearBeat();
      beatTimerRef.current = setTimeout(() => {
        beatTimerRef.current = null;
        if (!isPausedRef.current) {
          spokenIndexRef.current = currentLineIndex;
          speakLine(currentLine);
        }
      }, beatMs);
    }
  }, [currentLineIndex, isPlaying, isPaused, session, autoAdvance, timingSettings.pauseDuration, timingSettings.listenMode, lineListener.isSupported, speakLine, advanceLine, dialogueLines, mode, getVoiceForCharacter, clearBeat]);

  // Mic-unavailable fallback: if speech recognition can't run for the actor's
  // line (permission denied or a fatal error), the listener will never fire an
  // advance. Without this, playback would freeze on the user's line until they
  // manually press Done. When that happens, fall back to the fixed "Pause
  // Between Lines" timer so the scene keeps moving on its own.
  useEffect(() => {
    if (!isMyLineNow || !waitingForUser || !isPlaying || isPaused || !autoAdvance) return;
    if (!lineListener.unavailable) return;
    const timeout = setTimeout(() => {
      if (!isPausedRef.current) {
        setWaitingForUser(false);
        advanceLine();
      }
    }, timingSettings.pauseDuration * 1000);
    return () => clearTimeout(timeout);
  }, [lineListener.unavailable, isMyLineNow, waitingForUser, isPlaying, isPaused, autoAdvance, timingSettings.pauseDuration, advanceLine]);

  // Play/Pause/Stop handlers
  const handlePlay = useCallback(() => {
    if (mode === "wildcard") {
      const available = WILDCARD_MODIFIERS.filter((m) => m !== wildcardModifier);
      setWildcardModifier(available[Math.floor(Math.random() * available.length)]);
    }
    lineStartTimeRef.current = Date.now();
    setSceneComplete(false);
    setIsPaused(false);
    setIsPlaying(true);

    // Send status to remote
    broadcastChannelRef.current?.postMessage({ type: "status", isPlaying: true, isPaused: false });
  }, [mode, wildcardModifier]);

  const handlePause = useCallback(() => {
    voiceEngineRef.current?.pause();
    // Hold any pending pre-line beat so it doesn't fire (and speak) while paused.
    clearBeat();
    setIsPaused(true);
    broadcastChannelRef.current?.postMessage({ type: "status", isPlaying: true, isPaused: true });
  }, [clearBeat]);

  const handleResume = useCallback(() => {
    voiceEngineRef.current?.resume();
    // If we paused during the pre-line beat (audio for this line hadn't started
    // yet, so the beat was cleared on pause), clear the setup guard so resuming
    // re-arms the line instead of stranding it silently.
    if (spokenIndexRef.current !== currentIndexRef.current) {
      lastSetupIndexRef.current = -1;
    }
    setIsPaused(false);
    broadcastChannelRef.current?.postMessage({ type: "status", isPlaying: true, isPaused: false });
  }, []);

  const handleStop = useCallback(() => {
    voiceEngineRef.current?.stop();
    clearBeat();
    setIsPlaying(false);
    setIsPaused(false);
    setWaitingForUser(false);
    lastSetupIndexRef.current = -1;
    broadcastChannelRef.current?.postMessage({ type: "status", isPlaying: false, isPaused: false });
  }, [clearBeat]);

  const togglePlay = () => {
    if (isPlaying && !isPaused) {
      handlePause();
    } else if (isPaused) {
      handleResume();
    } else {
      handlePlay();
    }
  };

  const skipLine = useCallback(() => {
    voiceEngineRef.current?.stop();
    clearBeat();
    setWaitingForUser(false);
    advanceLine();
  }, [advanceLine, clearBeat]);

  const goBack = useCallback(() => {
    voiceEngineRef.current?.stop();
    clearBeat();
    setWaitingForUser(false);
    setCurrentLineIndex((prev) => Math.max(0, prev - 1));
  }, [clearBeat]);

  const restart = useCallback(() => {
    voiceEngineRef.current?.stop();
    clearBeat();
    setWaitingForUser(false);
    setCurrentLineIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setSceneComplete(false);
    setLineMetrics([]);
    setArcPoints([]);
    setSpeedRunScore(null);
    lastSetupIndexRef.current = -1;
    if (mode === "wildcard") setWildcardModifier(null);
    broadcastChannelRef.current?.postMessage({ type: "status", isPlaying: false, isPaused: false });
  }, [mode, clearBeat]);

  // Keep remote command ref up to date with latest handlers
  useEffect(() => {
    remoteCommandRef.current = (command: string) => {
      switch (command) {
        case "play": handlePlay(); break;
        case "pause": handlePause(); break;
        case "resume": handleResume(); break;
        case "stop": handleStop(); break;
        case "restart": restart(); break;
        case "next": skipLine(); break;
        case "prev": goBack(); break;
      }
    };
  }, [handlePlay, handlePause, handleResume, handleStop, restart, skipLine, goBack]);

  const handleModeChange = (newMode: RehearsalMode) => {
    setMode(newMode);
    restart();
  };

  if (!session) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>;
  }

  // Ritual mode check
  if (showRitual) {
    return <PreAuditionRitual onComplete={() => { setShowRitual(false); handlePlay(); }} onSkip={() => setShowRitual(false)} />;
  }

  const progress = dialogueLines.length > 0 ? ((currentLineIndex + 1) / dialogueLines.length) * 100 : 0;
  const characterNames = session.script.characters.map((c) => c.name);
  const currentLine = dialogueLines[currentLineIndex];


  // ─── Render mode-specific content ───────────────────────────
  const renderModeContent = () => {
    switch (mode) {
      case "memorization":
        return (
          <MemorizationMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            currentLineIndex={currentLineIndex}
          />
        );

      case "monologue":
        return (
          <MonologueMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            currentLineIndex={currentLineIndex}
          />
        );

      case "speed-run":
        return (
          <SpeedRunMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            onComplete={(score) => {
              setSpeedRunScore(score);
              setSceneComplete(true);
            }}
          />
        );

      case "cue-only":
        return (
          <CueOnlyMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            currentLineIndex={currentLineIndex}
          />
        );

      case "teleprompter":
        return (
          <TeleprompterMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            isPlaying={isPlaying}
            isPaused={isPaused}
          />
        );

      case "backstage":
        return (
          <BackstageMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            currentLineIndex={currentLineIndex}
            isPlaying={isPlaying}
            waitingForUser={waitingForUser}
            totalLines={dialogueLines.length}
          />
        );

      case "cold-read":
        return (
          <ColdReadMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            currentLineIndex={currentLineIndex}
            waitingForUser={waitingForUser}
          />
        );

      case "wildcard":
        return (
          <WildcardMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            currentLineIndex={currentLineIndex}
            waitingForUser={waitingForUser}
            modifier={wildcardModifier}
          />
        );

      case "subtext":
        return (
          <SubtextModeView
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            currentLineIndex={currentLineIndex}
            waitingForUser={waitingForUser}
            subtextConfigs={subtextConfigs}
          />
        );

      case "sleep-learning":
        return (
          <SleepLearningMode
            lines={session.script.lines}
            myCharacter={session.myCharacter}
            voiceAssignments={session.voiceAssignments}
            onExit={() => handleModeChange("standard")}
          />
        );

      // Standard mode (default)
      case "standard":
      default:
        return renderStandardView();
    }
  };

  // Standard view (the default script display)
  const renderStandardView = () => (
    <div className="space-y-2">
      {dialogueLines.map((line, index) => {
        const isCurrentLine = index === currentLineIndex;
        const isMyLine = line.character === session.myCharacter;
        const isDone = index < currentLineIndex;
        const emotion = emotions.get(line.id);
        const dirNote = directorNotes.find((n) => n.lineId === line.id);
        const lineSubtext = line.character ? subtextConfigs.find((s) => s.characterName === line.character) : null;

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
                {lineSubtext && (
                  <p className="text-xs text-pink-400 mt-1 italic">Subtext: {lineSubtext.subtextTag}</p>
                )}
                {isCurrentLine && dirNote && (
                  <div className="mt-2 bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 text-xs text-muted">
                    <span className="text-accent-light font-medium uppercase tracking-wide text-[10px]">{dirNote.category}</span>
                    <p className="mt-0.5">{dirNote.suggestion}</p>
                  </div>
                )}
              </div>
            </div>

            {isCurrentLine && isMyLine && waitingForUser && (
              <div className="mt-3 ml-9 flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-success">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    Your line — speak now
                  </div>
                  {timingSettings.listenMode && lineListener.isSupported && lineListener.isListening && (
                    <div className="flex items-center gap-1.5 text-xs text-accent-light bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm-7 9a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-3.07A7 7 0 0 1 5 11Z" />
                      </svg>
                      Listening · {Math.round(lineListener.matchScore * 100)}%
                    </div>
                  )}
                  {timingSettings.listenMode && !lineListener.isSupported && (
                    <div className="text-xs text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                      Mic listening not supported in this browser
                    </div>
                  )}
                  {timingSettings.listenMode && lineListener.isSupported && lineListener.unavailable && (
                    <div className="text-xs text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                      Mic unavailable — using timed pauses
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setWaitingForUser(false); advanceLine(); }} className="text-sm bg-success/20 text-success px-3 py-1 rounded-full hover:bg-success/30 transition-colors">
                    Done
                  </button>
                </div>
                {timingSettings.listenMode && lineListener.isListening && (lineListener.partialTranscript || lineListener.finalTranscript) && (
                  <p className="text-xs text-muted italic truncate">
                    {(lineListener.finalTranscript + " " + lineListener.partialTranscript).trim()}
                  </p>
                )}
                {timingSettings.listenMode && lineListener.error && !lineListener.unavailable && (
                  <p className="text-xs text-danger">Mic error: {lineListener.error}</p>
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
            <div className="mb-4">
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
  );

  // Check if the mode handles its own layout (no script view wrapper needed)
  const isFullscreenMode = mode === "teleprompter";
  // Sleep learning renders as a fixed overlay, so it doesn't need special layout handling

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
      {/* Header Bar */}
      <div className="bg-surface border-b border-border px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-semibold text-base sm:text-lg truncate">{session.script.title}</h1>
            <p className="text-xs sm:text-sm text-muted truncate">
              <span className="hidden sm:inline">Playing as </span>
              <span className="text-success font-medium">{session.myCharacter}</span>
              {" "}&middot; Line {currentLineIndex + 1}/{dialogueLines.length}
              {mode !== "standard" && <span className="ml-2 text-accent-light capitalize">({mode.replace("-", " ")})</span>}
              {isPaused && <span className="ml-2 text-warning">(Paused)</span>}
              {wildcardModifier && mode === "wildcard" && <span className="ml-2 text-warning truncate">{wildcardModifier}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm text-muted cursor-pointer">
              <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="accent-accent w-4 h-4" />
              Auto
            </label>
            <button onClick={() => setShowModeSelector(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors text-muted hover:text-foreground">
              Mode
            </button>
            <button onClick={() => setShowTimingControls(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors text-muted hover:text-foreground">
              Timing
            </button>
            <button onClick={() => router.push("/upload")} className="text-xs text-muted hover:text-foreground">New</button>
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
        <div className="bg-surface/50 border-b border-border px-3 sm:px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <button onClick={() => analysis && setShowAnalysis(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Analysis
            </button>
            <button onClick={() => setShowMemoryTracker(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Memory
            </button>
            <button onClick={() => setShowSubtext(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Subtext {subtextConfigs.length > 0 && <span className="ml-1 w-1.5 h-1.5 bg-accent rounded-full inline-block" />}
            </button>
            <button onClick={() => setShowObjective(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Objective {objectiveConfigs.length > 0 && <span className="ml-1 w-1.5 h-1.5 bg-accent rounded-full inline-block" />}
            </button>
            <button onClick={() => setShowRelationship(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Dynamics {relationshipConfigs.length > 0 && <span className="ml-1 w-1.5 h-1.5 bg-accent rounded-full inline-block" />}
            </button>
            <button onClick={() => { if (arcPoints.length > 0) setShowEmotionalArc(true); }} className={`text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${arcPoints.length === 0 ? "opacity-50" : ""}`}>
              Arc
            </button>
            <button onClick={() => setShowRitual(true)} className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
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

      {/* Playback Controls — sit above the script so the play button is
          near the line you're reading instead of at the bottom of the page */}
      {!isFullscreenMode && (
        <PlaybackControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          onPlay={handlePlay}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onRestart={restart}
          onPrevLine={goBack}
          onNextLine={skipLine}
          onOpenTiming={() => setShowTimingControls(true)}
          onOpenRemote={() => setShowRemotePanel(true)}
          currentLine={currentLineIndex}
          totalLines={dialogueLines.length}
        />
      )}

      {/* First-run "press play" hint — disappears on first press */}
      {!isPlaying && !isPaused && !sceneComplete && currentLineIndex === 0 && (
        <div className="bg-accent/10 border-b border-accent/20 px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-accent-light">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            <span>
              Press the round <span className="font-semibold">▶</span> button above to start.
              {timingSettings.listenMode && lineListener.isSupported && (
                <> When it&apos;s your turn, just speak your line — we&apos;ll advance when you&apos;re done.</>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Script View / Mode Content */}
      {isFullscreenMode ? (
        renderModeContent()
      ) : (
        <div className="flex-1 overflow-y-auto py-6 safe-pb">
          <div className="max-w-3xl mx-auto px-4">
            {renderModeContent()}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModeSelector && <ModeSelector currentMode={mode} onSelectMode={handleModeChange} onClose={() => setShowModeSelector(false)} />}
      {showTimingControls && <TimingControls settings={timingSettings} onChange={setTimingSettings} onClose={() => setShowTimingControls(false)} />}
      {showRemotePanel && session && <RemoteControlPanel sessionId={session.id} onClose={() => setShowRemotePanel(false)} />}
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
