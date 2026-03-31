"use client";

import { useState, useEffect } from "react";
import type { PerformanceNote } from "@/types";

interface PerformanceCoachPanelProps {
  notes: PerformanceNote[];
  sessionId?: string;
  onClose: () => void;
  onJumpToLine: (lineIndex: number) => void;
}

interface HeatmapEntry {
  severity: "clean" | "amber" | "red";
  count: number;
}

const SEVERITY_STYLES = {
  positive: {
    bg: "bg-success/10",
    border: "border-success/20",
    icon: "text-success",
    label: "Strength",
  },
  suggestion: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    icon: "text-warning",
    label: "Note",
  },
  critical: {
    bg: "bg-danger/10",
    border: "border-danger/20",
    icon: "text-danger",
    label: "Focus",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  pacing: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  energy:
    "m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  timing:
    "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  pause:
    "M15.75 5.25v13.5m-7.5-13.5v13.5",
  delivery:
    "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
};

const CATEGORY_LABELS: Record<string, string> = {
  pacing: "Pacing",
  energy: "Energy",
  timing: "Timing",
  pause: "Pause",
  delivery: "Delivery",
};

export default function PerformanceCoachPanel({
  notes: initialNotes,
  sessionId,
  onClose,
  onJumpToLine,
}: PerformanceCoachPanelProps) {
  const [notes, setNotes] = useState<PerformanceNote[]>(initialNotes);
  const [heatmap, setHeatmap] = useState<Record<string, HeatmapEntry>>({});
  const [loading, setLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Fetch from API if sessionId is provided
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetch(`/api/rehearsals/${sessionId}/coach`)
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error("Failed to fetch coach notes");
      })
      .then((data) => {
        if (data.notes && data.notes.length > 0) {
          setNotes(data.notes);
        }
        if (data.heatmap) {
          setHeatmap(data.heatmap);
        }
      })
      .catch(() => {
        // Use the initial notes passed as props
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Analyzing your performance...</p>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Clean Run</h2>
          <p className="text-muted mb-4">
            No specific notes on this take. Keep exploring the material -- the
            craft is in the details.
          </p>
          <button
            onClick={onClose}
            className="bg-accent hover:bg-accent-dark text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const heatmapEntries = Object.entries(heatmap);
  const hasHeatmap = heatmapEntries.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">AI Performance Coach</h2>
            <p className="text-sm text-muted">
              {notes.length} note{notes.length !== 1 ? "s" : ""} from this take
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasHeatmap && (
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  showHeatmap
                    ? "bg-accent/20 text-accent-light"
                    : "bg-surface-light text-muted hover:text-foreground"
                }`}
              >
                Stumble Heatmap
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {/* Stumble Heatmap */}
          {showHeatmap && hasHeatmap && (
            <div className="mb-4 bg-surface-light rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">
                Stumble Heatmap
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {heatmapEntries.map(([lineId, data]) => (
                  <div
                    key={lineId}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-110 ${
                      data.severity === "red"
                        ? "bg-danger/30 text-danger border border-danger/40"
                        : data.severity === "amber"
                        ? "bg-warning/30 text-warning border border-warning/40"
                        : "bg-success/20 text-success/70 border border-success/30"
                    }`}
                    title={`Line ${lineId}: ${data.count} stumble${data.count !== 1 ? "s" : ""}`}
                  >
                    {data.count}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-success/20 border border-success/30" />{" "}
                  Clean (0-1)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-warning/30 border border-warning/40" />{" "}
                  Amber (2-4)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-danger/30 border border-danger/40" />{" "}
                  Red (5+)
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {notes.map((note) => {
            const style = SEVERITY_STYLES[note.severity];
            const iconPath = CATEGORY_ICONS[note.category] || CATEGORY_ICONS.delivery;
            return (
              <div
                key={note.id}
                className={`${style.bg} border ${style.border} rounded-xl p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 ${style.icon}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={iconPath}
                      />
                    </svg>
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${style.icon}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-xs bg-surface-light px-2 py-0.5 rounded text-muted">
                      {CATEGORY_LABELS[note.category] || note.category}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onJumpToLine(note.lineIndex);
                      onClose();
                    }}
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
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-success rounded-full" />{" "}
              {notes.filter((n) => n.severity === "positive").length} strengths
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-warning rounded-full" />{" "}
              {notes.filter((n) => n.severity === "suggestion").length} notes
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-danger rounded-full" />{" "}
              {notes.filter((n) => n.severity === "critical").length} focus areas
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
          >
            Run Again
          </button>
        </div>
      </div>
    </div>
  );
}
