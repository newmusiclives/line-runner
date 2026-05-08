"use client";

import { useState } from "react";

export interface TimingSettings {
  pauseDuration: number;   // seconds between lines: 0.5 to 10
  playbackSpeed: number;   // voice rate multiplier: 0.5 to 2.0
  listenMode: boolean;     // listen to mic and auto-advance when user finishes their line
  matchThreshold: number;  // 0..1 — fraction of expected words needed to count as a match
  silenceMs: number;       // ms of silence after the user has spoken before auto-advance fires
}

interface TimingControlsProps {
  settings: TimingSettings;
  onChange: (settings: TimingSettings) => void;
  onClose: () => void;
}

export default function TimingControls({ settings, onChange, onClose }: TimingControlsProps) {
  const [pause, setPause] = useState(settings.pauseDuration);
  const [speed, setSpeed] = useState(settings.playbackSpeed);
  const [listen, setListen] = useState(settings.listenMode);
  const [threshold, setThreshold] = useState(settings.matchThreshold);
  const [silence, setSilence] = useState(settings.silenceMs);

  const emit = (next: Partial<TimingSettings>) => {
    onChange({
      pauseDuration: next.pauseDuration ?? pause,
      playbackSpeed: next.playbackSpeed ?? speed,
      listenMode: next.listenMode ?? listen,
      matchThreshold: next.matchThreshold ?? threshold,
      silenceMs: next.silenceMs ?? silence,
    });
  };

  const handlePauseChange = (val: number) => {
    setPause(val);
    emit({ pauseDuration: val });
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    emit({ playbackSpeed: val });
  };

  const handleListenChange = (val: boolean) => {
    setListen(val);
    emit({ listenMode: val });
  };

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    emit({ matchThreshold: val });
  };

  const handleSilenceChange = (val: number) => {
    setSilence(val);
    emit({ silenceMs: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-border w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto safe-pb">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-lg font-bold text-foreground">Timing &amp; Speed</h2>
          <button onClick={onClose} className="tap-target flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors -mr-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-7 sm:space-y-8">
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

          {/* Listen for me */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-foreground block">Listen for me</label>
                <p className="text-xs text-muted mt-0.5">Mic auto-advances when you finish your line</p>
              </div>
              <button
                role="switch"
                aria-checked={listen}
                onClick={() => handleListenChange(!listen)}
                className={`relative w-11 h-6 rounded-full transition-colors ${listen ? "bg-accent" : "bg-surface-light"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${listen ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
            {listen && (
              <>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted">Match strictness</label>
                    <span className="text-xs font-mono text-accent-light">{Math.round(threshold * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={0.9}
                    step={0.05}
                    value={threshold}
                    onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                    className="w-full accent-accent h-2 bg-surface-light rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>Forgiving</span>
                    <span>Strict</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted">End-of-line silence</label>
                    <span className="text-xs font-mono text-accent-light">{(silence / 1000).toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={5000}
                    step={250}
                    value={silence}
                    onChange={(e) => handleSilenceChange(parseInt(e.target.value, 10))}
                    className="w-full accent-accent h-2 bg-surface-light rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>1.0s</span>
                    <span>How long to wait after you stop talking</span>
                    <span>5.0s</span>
                  </div>
                </div>
              </>
            )}
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
