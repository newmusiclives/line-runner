"use client";

import { useState } from "react";
import type { DirectorNoteItem } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  pacing: "text-blue-400",
  emotion: "text-pink-400",
  subtext: "text-purple-400",
  physicality: "text-orange-400",
  general: "text-accent-light",
};

export function DirectorNoteIcon({ note }: { note: DirectorNoteItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-6 h-6 rounded bg-accent/20 hover:bg-accent/40 flex items-center justify-center transition-colors"
        title="Director's note"
      >
        <svg className="w-4 h-4 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 bottom-8 left-0 w-[min(18rem,calc(100vw-2rem))] bg-surface border border-border rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${CATEGORY_COLORS[note.category] || "text-accent-light"}`}>
              {note.category}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{note.suggestion}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="mt-2 text-xs text-muted hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
