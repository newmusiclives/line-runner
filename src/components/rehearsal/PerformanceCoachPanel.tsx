"use client";

import type { PerformanceNote } from "@/types";

interface PerformanceCoachPanelProps {
  notes: PerformanceNote[];
  onClose: () => void;
  onJumpToLine: (lineIndex: number) => void;
}

const SEVERITY_STYLES = {
  positive: { bg: "bg-success/10", border: "border-success/20", icon: "text-success", label: "Strength" },
  suggestion: { bg: "bg-warning/10", border: "border-warning/20", icon: "text-warning", label: "Note" },
  critical: { bg: "bg-danger/10", border: "border-danger/20", icon: "text-danger", label: "Focus" },
};

const CATEGORY_LABELS = {
  pacing: "Pacing",
  energy: "Energy",
  timing: "Timing",
  pause: "Pause",
  delivery: "Delivery",
};

export default function PerformanceCoachPanel({ notes, onClose, onJumpToLine }: PerformanceCoachPanelProps) {
  if (notes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Clean Run</h2>
          <p className="text-muted mb-4">No specific notes on this take. Keep exploring the material — the craft is in the details.</p>
          <button onClick={onClose} className="bg-accent hover:bg-accent-dark text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">AI Performance Coach</h2>
            <p className="text-sm text-muted">{notes.length} note{notes.length !== 1 ? "s" : ""} from this take</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {notes.map((note) => {
            const style = SEVERITY_STYLES[note.severity];
            return (
              <div key={note.id} className={`${style.bg} border ${style.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wide ${style.icon}`}>{style.label}</span>
                    <span className="text-xs bg-surface-light px-2 py-0.5 rounded text-muted">
                      {CATEGORY_LABELS[note.category]}
                    </span>
                  </div>
                  <button
                    onClick={() => { onJumpToLine(note.lineIndex); onClose(); }}
                    className="text-xs text-accent-light hover:text-accent transition-colors"
                  >
                    Jump to line {note.lineIndex + 1}
                  </button>
                </div>
                <p className="text-sm leading-relaxed">{note.note}</p>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-between">
          <div className="flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-success rounded-full" /> {notes.filter(n => n.severity === "positive").length} strengths</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-warning rounded-full" /> {notes.filter(n => n.severity === "suggestion").length} notes</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-danger rounded-full" /> {notes.filter(n => n.severity === "critical").length} focus areas</span>
          </div>
          <button onClick={onClose} className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
            Run Again
          </button>
        </div>
      </div>
    </div>
  );
}
