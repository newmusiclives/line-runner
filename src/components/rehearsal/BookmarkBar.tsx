"use client";

import { useState } from "react";
import type { SceneBookmark } from "@/types";

interface Props {
  bookmarks: SceneBookmark[];
  totalLines: number;
  currentLineIdx: number;
  loopActive: boolean;
  loopBookmarkId: string | null;
  onJump: (lineIdx: number) => void;
  onToggleLoop: (bookmarkId: string | null) => void;
  onAdd: (label: string, startIdx: number, endIdx: number) => void;
  onDelete: (id: string) => void;
}

export function BookmarkBar({ bookmarks, totalLines, currentLineIdx, loopActive, loopBookmarkId, onJump, onToggleLoop, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [startIdx, setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(10);

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd(label, startIdx, endIdx);
    setLabel("");
    setAdding(false);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      {/* Timeline bar */}
      <div className="relative h-6 bg-surface-light rounded-full mb-3 overflow-hidden">
        {/* Current position */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
          style={{ left: `${(currentLineIdx / Math.max(totalLines, 1)) * 100}%` }}
        />

        {/* Bookmark ranges */}
        {bookmarks.map((bm) => (
          <button
            key={bm.id}
            onClick={() => onJump(bm.startLineIdx)}
            className={`absolute top-1 bottom-1 rounded-full cursor-pointer transition-colors ${
              loopBookmarkId === bm.id ? "bg-success/40 border border-success" : "bg-accent/30 hover:bg-accent/50"
            }`}
            style={{
              left: `${(bm.startLineIdx / Math.max(totalLines, 1)) * 100}%`,
              width: `${Math.max(2, ((bm.endLineIdx - bm.startLineIdx) / Math.max(totalLines, 1)) * 100)}%`,
            }}
            title={bm.label}
          />
        ))}
      </div>

      {/* Bookmark list */}
      <div className="flex flex-wrap gap-2 items-center">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="flex items-center gap-1 bg-surface-light rounded-lg px-2 py-1 text-xs">
            <button onClick={() => onJump(bm.startLineIdx)} className="text-accent-light hover:text-foreground">
              {bm.label}
            </button>
            <button
              onClick={() => onToggleLoop(loopBookmarkId === bm.id ? null : bm.id)}
              className={`px-1 rounded ${loopBookmarkId === bm.id ? "text-success" : "text-muted hover:text-foreground"}`}
              title="Loop this section"
            >
              ↻
            </button>
            <button onClick={() => onDelete(bm.id)} className="text-muted/50 hover:text-danger">×</button>
          </div>
        ))}

        {adding ? (
          <div className="flex items-center gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Name..."
              className="bg-surface-light border border-border rounded px-2 py-0.5 text-xs w-24 focus:outline-none focus:border-accent"
              autoFocus
            />
            <input type="number" value={startIdx} onChange={(e) => setStartIdx(+e.target.value)} className="bg-surface-light border border-border rounded px-1 py-0.5 text-xs w-12" placeholder="Start" />
            <input type="number" value={endIdx} onChange={(e) => setEndIdx(+e.target.value)} className="bg-surface-light border border-border rounded px-1 py-0.5 text-xs w-12" placeholder="End" />
            <button onClick={handleAdd} className="text-xs text-success">Save</button>
            <button onClick={() => setAdding(false)} className="text-xs text-muted">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="text-xs text-muted hover:text-accent-light flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Bookmark
          </button>
        )}

        {loopActive && (
          <span className="text-xs text-success flex items-center gap-1">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Looping
          </span>
        )}
      </div>
    </div>
  );
}
