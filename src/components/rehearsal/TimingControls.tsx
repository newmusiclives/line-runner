"use client";

import { useState } from "react";

export interface TimingSettings {
  pauseDuration: number;   // seconds between lines: 0.5 to 10
  playbackSpeed: number;   // voice rate multiplier: 0.5 to 2.0
}

interface TimingControlsProps {
  settings: TimingSettings;
  onChange: (settings: TimingSettings) => void;
  onClose: () => void;
}

export default function TimingControls({ settings, onChange, onClose }: TimingControlsProps) {
  const [pause, setPause] = useState(settings.pauseDuration);
  const [speed, setSpeed] = useState(settings.playbackSpeed);

  const handlePauseChange = (val: number) => {
    setPause(val);
    onChange({ pauseDuration: val, playbackSpeed: speed });
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    onChange({ pauseDuration: pause, playbackSpeed: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Timing &amp; Speed</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Pause Duration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Pause Between Lines</label>
              <span className="text-sm font-mono text-accent-light">{pause.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={pause}
              onChange={(e) => handlePauseChange(parseFloat(e.target.value))}
              className="w-full accent-accent h-2 bg-surface-light rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>0.5s</span>
              <span>5s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Playback Speed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">AI Voice Speed</label>
              <span className="text-sm font-mono text-accent-light">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full accent-accent h-2 bg-surface-light rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-sm text-muted mb-2">Quick Presets</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { handlePauseChange(1); handleSpeedChange(1.5); }}
                className="bg-surface-light hover:bg-border px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Fast
              </button>
              <button
                onClick={() => { handlePauseChange(2); handleSpeedChange(1.0); }}
                className="bg-surface-light hover:bg-border px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Normal
              </button>
              <button
                onClick={() => { handlePauseChange(5); handleSpeedChange(0.7); }}
                className="bg-surface-light hover:bg-border px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Slow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
