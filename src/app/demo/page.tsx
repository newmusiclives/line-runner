"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSceneById } from "@/lib/famous-scenes";
import { getDefaultVoiceAssignment } from "@/lib/voice-engine";

const SCENE_ID = "romeo-juliet-balcony";

export default function DemoPage() {
  const router = useRouter();
  const scene = getSceneById(SCENE_ID)!;
  const [started, setStarted] = useState(false);

  function playAs(characterName: string) {
    setStarted(true);
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full">
        {/* Top glow accent */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/8 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-base text-accent-light">
              Instant Demo — No Signup Required
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Try Line Runner
          </h1>
          <p className="text-xl text-muted max-w-xl mx-auto leading-relaxed mb-2">
            Rehearse the most famous love scene ever written
          </p>
          <p className="text-lg text-accent-light font-medium">
            {scene.title}
          </p>
        </div>

        {/* Scene description card */}
        <div className="relative bg-surface border border-border rounded-2xl p-8 mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-base text-muted">{scene.playwright}</span>
            <span className="w-1 h-1 bg-muted rounded-full" />
            <span className="text-base text-muted">{scene.genre}</span>
            <span className="w-1 h-1 bg-muted rounded-full" />
            <span className="text-base text-muted">
              ~{scene.estimatedMinutes} min
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border bg-success/20 text-success border-success/30">
              Beginner
            </span>
          </div>
          <p className="text-lg text-muted leading-relaxed">
            {scene.description}
          </p>
        </div>

        {/* Character cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {scene.script.characters
            .filter((c) => c.name === "ROMEO" || c.name === "JULIET")
            .map((char) => (
              <button
                key={char.name}
                onClick={() => playAs(char.name)}
                disabled={started}
                className="group bg-surface border border-border hover:border-accent/50 rounded-2xl p-6 text-left transition-all hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">{char.name}</h3>
                  <span className="text-sm text-muted border border-border rounded-md px-2.5 py-0.5">
                    {char.lineCount} lines
                  </span>
                </div>
                <div className="text-base text-muted mb-4">
                  {char.suggestedGender} / {char.suggestedAge} /{" "}
                  {char.suggestedAccent}
                </div>
                <div className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-xl text-lg text-center transition-colors group-hover:shadow-lg group-hover:shadow-accent/25">
                  {started ? "Loading..." : `Play as ${char.name}`}
                </div>
              </button>
            ))}
        </div>

        {/* Nurse (minor character) note */}
        <p className="text-center text-base text-muted mb-8">
          The Nurse has 1 line and will be read by AI in both options.
        </p>

        {/* Browse more */}
        <div className="text-center">
          <Link
            href="/scenes"
            className="text-lg text-accent-light hover:text-accent font-medium transition-colors"
          >
            Browse more scenes &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
