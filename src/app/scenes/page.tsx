"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FAMOUS_SCENES, type FamousScene } from "@/lib/famous-scenes";
import {
  getDefaultVoiceAssignment,
  getPresetForCharacter,
  presetToVoiceAssignment,
  VOICE_PRESETS,
  type VoicePresetId,
} from "@/lib/voice-engine";

type Era = "All" | "Classical" | "Modern";
type Difficulty = "All" | "beginner" | "intermediate" | "advanced";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-success/20 text-success border-success/30",
  intermediate: "bg-warning/20 text-warning border-warning/30",
  advanced: "bg-danger/20 text-danger border-danger/30",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// State key: `${sceneId}::${characterName}` → preset id
type VoiceChoices = Record<string, VoicePresetId>;

function voiceKey(sceneId: string, characterName: string): string {
  return `${sceneId}::${characterName}`;
}

export default function ScenesPage() {
  const router = useRouter();
  const [eraFilter, setEraFilter] = useState<Era>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>("All");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [voiceChoices, setVoiceChoices] = useState<VoiceChoices>({});

  const filtered = FAMOUS_SCENES.filter((scene) => {
    if (eraFilter !== "All" && scene.era !== eraFilter) return false;
    if (difficultyFilter !== "All" && scene.difficulty !== difficultyFilter)
      return false;
    return true;
  });

  function getChosenPresetId(scene: FamousScene, characterName: string): VoicePresetId {
    const stored = voiceChoices[voiceKey(scene.id, characterName)];
    if (stored) return stored;
    const char = scene.script.characters.find((c) => c.name === characterName);
    return char ? getPresetForCharacter(char).id : "female-young";
  }

  function setChosenPresetId(sceneId: string, characterName: string, presetId: VoicePresetId) {
    setVoiceChoices((prev) => ({ ...prev, [voiceKey(sceneId, characterName)]: presetId }));
  }

  function startScene(scene: FamousScene, characterName: string, applyPresets: boolean) {
    const voiceAssignments = scene.script.characters.map((char, i) => {
      if (!applyPresets || char.name === characterName) {
        // For the user's own character we still need an assignment in the
        // session shape, but TTS never fires for it — defaults are fine.
        return getDefaultVoiceAssignment(char, i);
      }
      const presetId = getChosenPresetId(scene, char.name);
      const preset = VOICE_PRESETS.find((p) => p.id === presetId);
      return preset ? presetToVoiceAssignment(char, preset) : getDefaultVoiceAssignment(char, i);
    });
    const session = {
      id: `demo-${scene.id}`,
      script: scene.script,
      myCharacter: characterName,
      voiceAssignments,
      currentLineIndex: 0,
      isPlaying: false,
    };
    sessionStorage.setItem("rehearsal-session", JSON.stringify(session));
    router.push(`/rehearse/demo-${scene.id}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Famous Scenes Library
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Jump into iconic scenes from the greatest plays
        </p>
      </div>

      {/* Upload-your-own banner */}
      <div className="mb-10 max-w-4xl mx-auto">
        <Link
          href="/upload"
          className="block bg-surface border border-border hover:border-accent/50 rounded-2xl p-5 sm:p-6 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold mb-0.5">Rehearse your own script</div>
              <p className="text-sm text-muted">
                Free users get 1 upload + 5 minutes of AI audio — no credit card.
              </p>
            </div>
            <span className="text-accent-light font-medium whitespace-nowrap">Upload &rarr;</span>
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
        {/* Era Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-base text-muted mr-1">Era:</span>
          {(["All", "Classical", "Modern"] as Era[]).map((era) => (
            <button
              key={era}
              onClick={() => setEraFilter(era)}
              className={`px-4 py-1.5 rounded-lg text-base font-medium transition-colors ${
                eraFilter === era
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/40"
              }`}
            >
              {era}
            </button>
          ))}
        </div>

        {/* Difficulty Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-base text-muted mr-1">Difficulty:</span>
          {(["All", "beginner", "intermediate", "advanced"] as Difficulty[]).map(
            (diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-4 py-1.5 rounded-lg text-base font-medium transition-colors ${
                  difficultyFilter === diff
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/40"
                }`}
              >
                {diff === "All" ? "All" : DIFFICULTY_LABELS[diff]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((scene) => {
          const isExpanded = expandedCard === scene.id;
          const firstChar = scene.script.characters[0];

          return (
            <div
              key={scene.id}
              className="bg-surface border border-border rounded-2xl p-6 hover:border-accent/30 transition-colors flex flex-col"
            >
              {/* Title & Playwright */}
              <div className="mb-3">
                <h3 className="text-xl font-bold leading-tight mb-1">
                  {scene.title}
                </h3>
                <p className="text-base text-muted">{scene.playwright}</p>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border ${DIFFICULTY_COLORS[scene.difficulty]}`}
                >
                  {DIFFICULTY_LABELS[scene.difficulty]}
                </span>
                <span className="text-sm text-muted border border-border rounded-md px-2.5 py-0.5">
                  {scene.genre}
                </span>
                <span className="text-sm text-muted border border-border rounded-md px-2.5 py-0.5">
                  ~{scene.estimatedMinutes} min
                </span>
                <span className="text-sm text-muted border border-border rounded-md px-2.5 py-0.5">
                  {scene.script.characters.length} characters
                </span>
              </div>

              {/* Description */}
              <p className="text-lg text-muted leading-relaxed mb-5 flex-1">
                {scene.description}
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => startScene(scene, firstChar.name, false)}
                  className="w-full bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2.5 rounded-xl text-base transition-all hover:scale-[1.02]"
                >
                  Quick Start as {firstChar.name}
                </button>
                <button
                  onClick={() =>
                    setExpandedCard(isExpanded ? null : scene.id)
                  }
                  className="w-full border border-border hover:border-accent/50 text-foreground font-medium px-4 py-2.5 rounded-xl text-base transition-colors"
                >
                  {isExpanded ? "Hide character & voice options" : "Choose character & voices"}
                </button>
              </div>

              {/* Expanded character list with voice preset pickers */}
              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <p className="text-xs text-muted leading-relaxed">
                    Pick voices for the AI characters, then play as anyone.
                    Custom voices use real-time TTS; the &ldquo;default&rdquo;
                    voice keeps the pre-recorded studio audio.
                  </p>
                  {scene.script.characters.map((char) => {
                    const chosenPresetId = getChosenPresetId(scene, char.name);
                    return (
                      <div
                        key={char.name}
                        className="bg-surface-light border border-border rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div>
                            <span className="text-base font-semibold">{char.name}</span>
                            <span className="text-sm text-muted ml-3">{char.lineCount} lines</span>
                            <div className="text-xs text-muted mt-0.5">
                              Suggested: {char.suggestedGender} / {char.suggestedAge}
                            </div>
                          </div>
                          <button
                            onClick={() => startScene(scene, char.name, true)}
                            className="text-sm bg-accent hover:bg-accent-dark text-white font-medium px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Play as {char.name} &rarr;
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {VOICE_PRESETS.map((preset) => {
                            const selected = preset.id === chosenPresetId;
                            return (
                              <button
                                key={preset.id}
                                onClick={() => setChosenPresetId(scene.id, char.name, preset.id)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                  selected
                                    ? "bg-accent/15 border-accent text-accent-light"
                                    : "bg-transparent border-border text-muted hover:border-accent/40 hover:text-foreground"
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl text-muted">
            No scenes match your filters. Try adjusting them.
          </p>
        </div>
      )}
    </div>
  );
}
