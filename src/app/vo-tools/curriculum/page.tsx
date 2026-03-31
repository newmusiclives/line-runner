"use client";

import { useState, useEffect, useCallback } from "react";
import { GENRE_LABELS, GENRE_DESCRIPTIONS, LEVEL_LABELS, getCurriculumModule } from "@/lib/vo/curriculum-data";
import type { VOGenre, CurriculumLevel } from "@/types";

interface ProgressEntry {
  genre: VOGenre;
  currentLevel: CurriculumLevel;
  completedScripts: string[];
  certificationBadge: string | null;
}

export default function CurriculumPage() {
  const [selectedGenre, setSelectedGenre] = useState<VOGenre | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CurriculumLevel>(1);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);

  const genres: VOGenre[] = ["commercial", "audiobook", "e-learning", "character", "medical", "promo", "podcast"];

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/vo-tools/curriculum");
      if (res.ok) setProgress(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const getGenreProgress = (genre: VOGenre) => progress.find((p) => p.genre === genre);

  const isScriptCompleted = (scriptId: string) => {
    if (!selectedGenre) return false;
    const gp = getGenreProgress(selectedGenre);
    return gp?.completedScripts.includes(scriptId) ?? false;
  };

  const completeScript = async (scriptId: string) => {
    if (!selectedGenre) return;
    setCompleting(scriptId);
    try {
      const res = await fetch("/api/vo-tools/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: selectedGenre, scriptId, level: selectedLevel }),
      });
      if (res.ok) await fetchProgress();
    } catch {}
    setCompleting(null);
  };

  if (!selectedGenre) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">VO Genre Training</h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            7 professional genres. 5 levels each. Graded scripts with AI coaching feedback and Line Runner certification on completion.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.map((genre) => (
            <button key={genre} onClick={() => setSelectedGenre(genre)} className="bg-surface border border-border rounded-xl p-6 text-left hover:border-accent/30 transition-all group">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-accent-light transition-colors">{GENRE_LABELS[genre]}</h3>
              <p className="text-sm text-muted leading-relaxed mb-4">{GENRE_DESCRIPTIONS[genre]}</p>
              {(() => {
                const gp = getGenreProgress(genre);
                const completed = gp?.completedScripts.length ?? 0;
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[1, 2, 3, 4, 5].map((l) => (
                        <div key={l} className={`w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center text-[10px] ${gp && gp.currentLevel > l ? "bg-success text-white" : gp && gp.currentLevel === l ? "bg-accent/20 text-accent-light" : "bg-surface-light text-muted"}`}>{l}</div>
                      ))}
                    </div>
                    <span className="text-xs text-muted">{completed}/15 scripts{gp?.certificationBadge ? " ★" : ""}</span>
                  </div>
                );
              })()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const module = getCurriculumModule(selectedGenre, selectedLevel);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => setSelectedGenre(null)} className="text-sm text-muted hover:text-foreground mb-6 flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        All Genres
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{GENRE_LABELS[selectedGenre]}</h1>
          <p className="text-muted mt-1">{GENRE_DESCRIPTIONS[selectedGenre]}</p>
        </div>
      </div>

      {/* Level Selector */}
      <div className="flex gap-2 mb-8">
        {([1, 2, 3, 4, 5] as CurriculumLevel[]).map((level) => (
          <button key={level} onClick={() => setSelectedLevel(level)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${selectedLevel === level ? "bg-accent text-white shadow-lg shadow-accent/25" : "bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30"}`}>
            <div>Level {level}</div>
            <div className="text-xs opacity-70">{LEVEL_LABELS[level]}</div>
          </button>
        ))}
      </div>

      {/* Scripts */}
      <div className="space-y-4">
        {module.scripts.map((script, idx) => (
          <div key={script.id} className="bg-surface border border-border rounded-xl overflow-hidden">
            <button onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)} className="w-full flex items-center justify-between p-5 text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent-light flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{script.title}</h3>
                  <div className="flex gap-3 text-xs text-muted mt-1">
                    <span>Consistency: {script.passCriteria.consistencyMin}%+</span>
                    <span>Timing: {script.passCriteria.timingAccuracyMin}%+</span>
                    <span>Confidence: {script.passCriteria.deliveryConfidenceMin}%+</span>
                  </div>
                </div>
              </div>
              <svg className={`w-5 h-5 text-muted transition-transform ${expandedScript === script.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {expandedScript === script.id && (
              <div className="px-5 pb-5 border-t border-border pt-4">
                <div className="bg-surface-light rounded-xl p-4 mb-4">
                  <p className="text-lg leading-relaxed">{script.text}</p>
                </div>
                <div className="flex gap-3">
                  {isScriptCompleted(script.id) ? (
                    <div className="flex-1 bg-success/10 text-success font-medium py-2.5 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      Completed
                    </div>
                  ) : (
                    <button onClick={() => completeScript(script.id)} disabled={completing === script.id} className="flex-1 bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                      {completing === script.id ? "Saving..." : "Mark Complete"}
                    </button>
                  )}
                  <button className="px-4 py-2.5 bg-surface-light hover:bg-border text-sm rounded-lg transition-colors">
                    Practice Read
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
