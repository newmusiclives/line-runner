"use client";

import { useState } from "react";
import type { ScriptAnalysis } from "@/types";

interface ScriptAnalysisPanelProps {
  analysis: ScriptAnalysis;
  onClose: () => void;
}

export default function ScriptAnalysisPanel({ analysis, onClose }: ScriptAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "characters" | "beats">("overview");

  const difficultyColors = {
    easy: "text-success",
    moderate: "text-warning",
    hard: "text-danger",
    "very-hard": "text-danger",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[90dvh] sm:max-h-[85dvh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Script Analysis</h2>
            <p className="text-sm text-muted">AI-powered breakdown of your script</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {(["overview", "characters", "beats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-accent text-accent-light" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab === "overview" ? "Overview" : tab === "characters" ? "Character Arcs" : "Key Beats"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-muted mb-1">Genre</div>
                  <div className="text-lg font-semibold capitalize">{analysis.genre}</div>
                </div>
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-muted mb-1">Tone</div>
                  <div className="text-lg font-semibold capitalize">{analysis.tone}</div>
                </div>
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-muted mb-1">Memorisation Difficulty</div>
                  <div className={`text-lg font-semibold capitalize ${difficultyColors[analysis.memorisationDifficulty]}`}>
                    {analysis.memorisationDifficulty.replace("-", " ")}
                  </div>
                </div>
                <div className="bg-surface-light rounded-xl p-4">
                  <div className="text-sm text-muted mb-1">Est. Sessions to Memorize</div>
                  <div className="text-lg font-semibold text-accent-light">{analysis.estimatedSessionsToMemorize}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Suggested Voice Profiles</h3>
                <div className="space-y-2">
                  {Object.entries(analysis.suggestedVoiceProfiles).map(([name, profile]) => (
                    <div key={name} className="flex items-center justify-between bg-surface-light rounded-lg px-4 py-3">
                      <span className="font-medium">{name}</span>
                      <div className="flex gap-2 text-sm text-muted">
                        <span className="bg-background px-2 py-0.5 rounded">{profile.gender}</span>
                        <span className="bg-background px-2 py-0.5 rounded">{profile.age}</span>
                        <span className="bg-background px-2 py-0.5 rounded">{profile.accent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "characters" && (
            <div className="space-y-4">
              {Object.entries(analysis.characterArcs).map(([name, arc]) => (
                <div key={name} className="bg-surface-light rounded-xl p-5">
                  <h3 className="font-semibold text-accent-light mb-2">{name}</h3>
                  <p className="text-muted leading-relaxed">{arc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "beats" && (
            <div className="space-y-6">
              {analysis.turningPoints.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-danger rounded-full" />
                    Turning Points
                  </h3>
                  <div className="space-y-2">
                    {analysis.turningPoints.map((tp, i) => (
                      <div key={i} className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 text-sm">
                        {tp.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.keyBeats.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full" />
                    Key Beats
                  </h3>
                  <div className="space-y-2">
                    {analysis.keyBeats.map((beat, i) => (
                      <div key={i} className="bg-accent/10 border border-accent/20 rounded-lg px-4 py-3 text-sm">
                        {beat.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
