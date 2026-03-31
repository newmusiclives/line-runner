"use client";

import type { EmotionalArcPoint } from "@/types";
import { EMOTION_COLORS } from "@/lib/ai/emotion-detector";

interface Props {
  points: EmotionalArcPoint[];
  onTapPoint?: (lineIndex: number) => void;
  onClose: () => void;
  sessionLabel?: string;
}

export default function EmotionalArcChart({ points, onTapPoint, onClose, sessionLabel }: Props) {
  if (points.length === 0) return null;

  const maxIntensity = Math.max(...points.map((p) => p.intensity), 1);
  const width = 800;
  const height = 300;
  const padding = 40;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const getX = (i: number) => padding + (i / Math.max(points.length - 1, 1)) * chartW;
  const getY = (intensity: number) => padding + chartH - (intensity / maxIntensity) * chartH;

  // Build SVG path
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.intensity)}`).join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Emotional Arc</h2>
            <p className="text-sm text-muted">{sessionLabel || "Scene intensity over time"} — tap any point to replay</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 350 }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
              <line key={frac} x1={padding} y1={getY(frac * maxIntensity)} x2={width - padding} y2={getY(frac * maxIntensity)} stroke="var(--border)" strokeWidth={1} strokeDasharray={frac === 0 ? "0" : "4 4"} />
            ))}
            {/* Arc line */}
            <path d={pathD} fill="none" stroke="var(--accent-light)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {/* Area fill */}
            <path d={`${pathD} L ${getX(points.length - 1)} ${padding + chartH} L ${padding} ${padding + chartH} Z`} fill="url(#arcGrad)" opacity={0.15} />
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-light)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* Data points */}
            {points.map((p, i) => (
              <g key={i} onClick={() => onTapPoint?.(p.lineIndex)} className="cursor-pointer">
                <circle cx={getX(i)} cy={getY(p.intensity)} r={6} fill={EMOTION_COLORS[p.emotion] || "var(--accent)"} stroke="var(--surface)" strokeWidth={2} />
                <title>{`Line ${p.lineIndex + 1}: ${p.emotion} (intensity: ${Math.round(p.intensity * 100)}%)`}</title>
              </g>
            ))}
            {/* Y-axis label */}
            <text x={10} y={padding + chartH / 2} fill="var(--muted)" fontSize={11} textAnchor="middle" transform={`rotate(-90 10 ${padding + chartH / 2})`}>Intensity</text>
            <text x={width / 2} y={height - 5} fill="var(--muted)" fontSize={11} textAnchor="middle">Lines</text>
          </svg>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {Object.entries(EMOTION_COLORS).filter(([k]) => k !== "neutral").map(([emotion, color]) => (
              <div key={emotion} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{emotion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
