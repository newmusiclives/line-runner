"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FAMOUS_SCENES, type FamousScene } from "@/lib/famous-scenes";
import { getDefaultVoiceAssignment } from "@/lib/voice-engine";

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

export default function ScenesPage() {
  const router = useRouter();
  const [eraFilter, setEraFilter] = useState<Era>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>("All");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const filtered = FAMOUS_SCENES.filter((scene) => {
    if (eraFilter !== "All" && scene.era !== eraFilter) return false;
    if (difficultyFilter !== "All" && scene.difficulty !== difficultyFilter)
      return false;
    return true;
  });

  function startScene(scene: FamousScene, characterName: string) {
    const voiceAssignments = scene.script.characters.map((char, i) =>
      getDefaultVoiceAssignment(char, i)
    );
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
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Famous Scenes Library
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Jump into iconic scenes from the greatest plays
        </p>
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
                  onClick={() => startScene(scene, firstChar.name)}
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
                  {isExpanded ? "Hide Characters" : "Choose Character"}
                </button>
              </div>

              {/* Expanded character list */}
              {isExpanded && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {scene.script.characters.map((char) => (
                    <button
                      key={char.name}
                      onClick={() => startScene(scene, char.name)}
                      className="w-full flex items-center justify-between bg-surface-light hover:bg-accent/10 border border-border hover:border-accent/40 rounded-xl px-4 py-3 transition-colors text-left"
                    >
                      <div>
                        <span className="text-base font-semibold">
                          {char.name}
                        </span>
                        <span className="text-sm text-muted ml-3">
                          {char.lineCount} lines
                        </span>
                        <div className="text-sm text-muted mt-0.5">
                          {char.suggestedGender} / {char.suggestedAge} /{" "}
                          {char.suggestedAccent}
                        </div>
                      </div>
                      <span className="text-accent-light text-sm font-medium shrink-0 ml-2">
                        Play &rarr;
                      </span>
                    </button>
                  ))}
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
