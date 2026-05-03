"use client";

import { useState } from "react";
import type { ObjectiveObstacle } from "@/types";

interface Props {
  characters: string[];
  myCharacter: string;
  current?: ObjectiveObstacle[];
  onApply: (configs: ObjectiveObstacle[]) => void;
  onClose: () => void;
}

export default function ObjectiveObstaclePanel({ characters, myCharacter, current, onApply, onClose }: Props) {
  const allChars = [myCharacter, ...characters.filter((c) => c !== myCharacter)];
  const [configs, setConfigs] = useState<ObjectiveObstacle[]>(
    current || allChars.map((c) => ({ characterName: c, objective: "", obstacle: "" }))
  );

  const update = (name: string, field: "objective" | "obstacle", value: string) => {
    setConfigs((prev) => prev.map((c) => c.characterName === name ? { ...c, [field]: value } : c));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90dvh] sm:max-h-[85dvh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Objective & Obstacle</h2>
            <p className="text-sm text-muted">Give every character a want and a block — Stanislavski built into software</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-muted">
            The AI adjusts delivery emphasis when objectives and obstacles are set. Change them mid-scene to transform the performance.
          </div>
          {configs.map((cfg) => (
            <div key={cfg.characterName} className="bg-surface-light rounded-xl p-5">
              <h3 className={`font-semibold mb-3 ${cfg.characterName === myCharacter ? "text-success" : "text-accent-light"}`}>
                {cfg.characterName} {cfg.characterName === myCharacter && <span className="text-xs font-normal text-muted">(You)</span>}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted block mb-1">Objective — &quot;I want to...&quot;</label>
                  <input type="text" value={cfg.objective} onChange={(e) => update(cfg.characterName, "objective", e.target.value)} placeholder="e.g., convince her to stay" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">Obstacle — &quot;But...&quot;</label>
                  <input type="text" value={cfg.obstacle} onChange={(e) => update(cfg.characterName, "obstacle", e.target.value)} placeholder="e.g., she will not look at me" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancel</button>
          <button onClick={() => { onApply(configs.filter((c) => c.objective || c.obstacle)); onClose(); }} className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">Apply</button>
        </div>
      </div>
    </div>
  );
}
