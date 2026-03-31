"use client";

import type { ScriptLine } from "@/types";

interface StumbleData {
  lineId: string;
  count: number;
  severity: "clean" | "amber" | "red";
}

interface LineMemoryTrackerProps {
  lines: ScriptLine[];
  myCharacter: string;
  stumbleData: Map<string, StumbleData>;
  onStartDrill: (lineIds: string[]) => void;
  onClose: () => void;
}

export default function LineMemoryTracker({ lines, myCharacter, stumbleData, onStartDrill, onClose }: LineMemoryTrackerProps) {
  const myLines = lines.filter((l) => l.type === "dialogue" && l.character === myCharacter);
  const problemLines = myLines
    .filter((l) => {
      const data = stumbleData.get(l.id);
      return data && data.severity !== "clean";
    })
    .sort((a, b) => {
      const aCount = stumbleData.get(a.id)?.count || 0;
      const bCount = stumbleData.get(b.id)?.count || 0;
      return bCount - aCount;
    });

  const topFive = problemLines.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Line Memory Tracker</h2>
            <p className="text-sm text-muted">Your sticking points across all sessions</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {topFive.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">All Clean</h3>
              <p className="text-muted">No sticking points detected yet. Keep rehearsing — the tracker learns from every session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted">
                  {problemLines.length} line{problemLines.length !== 1 ? "s" : ""} need attention
                </p>
                {topFive.length > 0 && (
                  <button
                    onClick={() => onStartDrill(topFive.map((l) => l.id))}
                    className="bg-accent hover:bg-accent-dark text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Warm-Up Drill (Top 5)
                  </button>
                )}
              </div>

              {/* Heat Map */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted mb-3">HEAT MAP</h3>
                <div className="flex flex-wrap gap-1">
                  {myLines.map((line) => {
                    const data = stumbleData.get(line.id);
                    const severity = data?.severity || "clean";
                    const colors = {
                      clean: "bg-success/20",
                      amber: "bg-warning/40",
                      red: "bg-danger/60",
                    };
                    return (
                      <div
                        key={line.id}
                        className={`w-6 h-6 rounded ${colors[severity]} transition-colors cursor-pointer hover:ring-2 hover:ring-foreground/20`}
                        title={`Line: "${line.text.slice(0, 40)}..." ${data ? `(${data.count} stumbles)` : "(clean)"}`}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-success/20 rounded" /> Clean</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-warning/40 rounded" /> Amber (2-4)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-danger/60 rounded" /> Red (5+)</span>
                </div>
              </div>

              {/* Problem Lines Detail */}
              <h3 className="text-sm font-semibold text-muted mb-2">TOP PROBLEM LINES</h3>
              {topFive.map((line, idx) => {
                const data = stumbleData.get(line.id)!;
                return (
                  <div key={line.id} className={`rounded-xl p-4 ${data.severity === "red" ? "bg-danger/10 border border-danger/20" : "bg-warning/10 border border-warning/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted">#{idx + 1}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${data.severity === "red" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"}`}>
                        {data.count} stumble{data.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{line.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
