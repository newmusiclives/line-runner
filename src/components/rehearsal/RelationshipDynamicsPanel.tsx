"use client";

import { useState } from "react";
import type { RelationshipDynamic } from "@/types";

interface Props {
  characters: string[];
  myCharacter: string;
  current?: RelationshipDynamic[];
  onApply: (dynamics: RelationshipDynamic[]) => void;
  onClose: () => void;
}

const PRESETS: { label: string; value: RelationshipDynamic["preset"]; intimacy: number; power: number }[] = [
  { label: "Professional", value: "professional", intimacy: 20, power: 0 },
  { label: "Romantic", value: "romantic", intimacy: 85, power: 0 },
  { label: "Adversarial", value: "adversarial", intimacy: 10, power: 30 },
  { label: "Family", value: "family", intimacy: 60, power: 20 },
];

export default function RelationshipDynamicsPanel({ characters, myCharacter, current, onApply, onClose }: Props) {
  const otherChars = characters.filter((c) => c !== myCharacter);
  const [dynamics, setDynamics] = useState<RelationshipDynamic[]>(
    current || otherChars.map((c) => ({ character1: myCharacter, character2: c, intimacy: 50, powerBalance: 0 }))
  );

  const update = (char2: string, field: "intimacy" | "powerBalance", value: number) => {
    setDynamics((prev) => prev.map((d) => d.character2 === char2 ? { ...d, [field]: value, preset: undefined } : d));
  };

  const applyPreset = (char2: string, preset: typeof PRESETS[number]) => {
    setDynamics((prev) => prev.map((d) => d.character2 === char2 ? { ...d, intimacy: preset.intimacy, powerBalance: preset.power, preset: preset.value } : d));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90dvh] sm:max-h-[85dvh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Relationship Dynamics</h2>
            <p className="text-sm text-muted">Set the history between characters — intimacy and power</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {dynamics.map((d) => (
            <div key={d.character2} className="bg-surface-light rounded-xl p-5">
              <h3 className="font-semibold text-accent-light mb-4">{myCharacter} & {d.character2}</h3>
              {/* Quick Presets */}
              <div className="flex gap-2 mb-4">
                {PRESETS.map((p) => (
                  <button key={p.value} onClick={() => applyPreset(d.character2, p)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${d.preset === p.value ? "bg-accent text-white" : "bg-surface hover:bg-border text-muted"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Intimacy Slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-muted">Intimacy</label>
                  <span className="text-sm font-medium">{d.intimacy}%</span>
                </div>
                <input type="range" min={0} max={100} value={d.intimacy} onChange={(e) => update(d.character2, "intimacy", parseInt(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>Strangers</span><span>Acquaintances</span><span>Close</span><span>Lovers</span>
                </div>
              </div>
              {/* Power Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-muted">Power Balance</label>
                  <span className="text-sm font-medium">{d.powerBalance > 0 ? `+${d.powerBalance}` : d.powerBalance}</span>
                </div>
                <input type="range" min={-100} max={100} value={d.powerBalance} onChange={(e) => update(d.character2, "powerBalance", parseInt(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>{myCharacter} subordinate</span><span>Equal</span><span>{myCharacter} dominant</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancel</button>
          <button onClick={() => { onApply(dynamics); onClose(); }} className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">Apply</button>
        </div>
      </div>
    </div>
  );
}
