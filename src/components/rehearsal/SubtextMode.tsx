"use client";

import { useState } from "react";
import type { SubtextConfig, ScriptLine } from "@/types";
import { SUBTEXT_PRESETS } from "@/types";

interface SubtextModeProps {
  characters: string[];
  myCharacter: string;
  onApply: (configs: SubtextConfig[]) => void;
  onClose: () => void;
  currentConfigs?: SubtextConfig[];
}

export default function SubtextMode({ characters, myCharacter, onApply, onClose, currentConfigs }: SubtextModeProps) {
  const otherCharacters = characters.filter((c) => c !== myCharacter);
  const [configs, setConfigs] = useState<SubtextConfig[]>(
    currentConfigs || otherCharacters.map((c) => ({ characterName: c, subtextTag: "" }))
  );
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const updateConfig = (charName: string, tag: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.characterName === charName ? { ...c, subtextTag: tag, custom: !SUBTEXT_PRESETS.includes(tag as typeof SUBTEXT_PRESETS[number]) } : c))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Subtext Mode</h2>
            <p className="text-sm text-muted">Set the unspoken intention beneath each character&apos;s words</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-muted">
            A character says &quot;Fine.&quot; The subtext is fury. Assign each character an emotional undercurrent — the AI voice will perform every line through that lens.
          </div>

          {configs.map((config) => (
            <div key={config.characterName} className="bg-surface-light rounded-xl p-5">
              <h3 className="font-semibold text-accent-light mb-3">{config.characterName}</h3>

              <div className="flex flex-wrap gap-2 mb-3">
                {SUBTEXT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => updateConfig(config.characterName, preset)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      config.subtextTag === preset
                        ? "bg-accent text-white"
                        : "bg-surface hover:bg-border text-muted hover:text-foreground"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or type a custom subtext..."
                  value={customInputs[config.characterName] || ""}
                  onChange={(e) => setCustomInputs((prev) => ({ ...prev, [config.characterName]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInputs[config.characterName]) {
                      updateConfig(config.characterName, customInputs[config.characterName]);
                    }
                  }}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => {
                    if (customInputs[config.characterName]) {
                      updateConfig(config.characterName, customInputs[config.characterName]);
                    }
                  }}
                  className="bg-accent/20 text-accent-light px-3 py-2 rounded-lg text-sm hover:bg-accent/30 transition-colors"
                >
                  Set
                </button>
              </div>

              {config.subtextTag && (
                <div className="mt-3 text-sm">
                  Active subtext: <span className="text-accent-light font-medium">{config.subtextTag}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-between">
          <button onClick={() => { setConfigs(otherCharacters.map((c) => ({ characterName: c, subtextTag: "" }))); }} className="text-sm text-muted hover:text-foreground transition-colors">
            Clear All
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">Cancel</button>
            <button onClick={() => { onApply(configs.filter((c) => c.subtextTag)); onClose(); }} className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
              Apply Subtext
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
