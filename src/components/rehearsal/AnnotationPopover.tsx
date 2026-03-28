"use client";

import { useState } from "react";
import type { NoteType } from "@/types";

const NOTE_TYPES: { type: NoteType; label: string; color: string; icon: string }[] = [
  { type: "personal", label: "Personal Note", color: "text-blue-400 bg-blue-500/20", icon: "📝" },
  { type: "blocking", label: "Blocking Cue", color: "text-orange-400 bg-orange-500/20", icon: "🎭" },
  { type: "emotion", label: "Emotion Beat", color: "text-purple-400 bg-purple-500/20", icon: "💜" },
  { type: "director", label: "Director Note", color: "text-green-400 bg-green-500/20", icon: "🎬" },
];

interface Props {
  lineId: string;
  scriptId: string;
  existingNotes?: { id: string; noteType: NoteType; content: string }[];
  onSave?: (lineId: string, noteType: NoteType, content: string) => void;
  onDelete?: (annotationId: string) => void;
}

export function AnnotationPopover({ lineId, scriptId, existingNotes = [], onSave, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<NoteType>("personal");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/scripts/${scriptId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId, noteType: selectedType, content }),
      });
      onSave?.(lineId, selectedType, content);
      setContent("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Annotation dots
  const dots = existingNotes.map((n) => {
    const type = NOTE_TYPES.find((t) => t.type === n.noteType);
    return (
      <span key={n.id} className={`w-2 h-2 rounded-full ${type?.color || "bg-gray-400"}`} title={`${type?.label}: ${n.content}`} />
    );
  });

  return (
    <div className="relative inline-flex items-center gap-0.5">
      {dots}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-5 h-5 rounded flex items-center justify-center text-muted/50 hover:text-muted hover:bg-surface-light transition-colors"
        title="Add annotation"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-6 left-0 w-80 bg-surface border border-border rounded-xl p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1.5 mb-3">
            {NOTE_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => setSelectedType(t.type)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                  selectedType === t.type ? `${t.color} border-current` : "border-border text-muted"
                }`}
              >
                {t.icon} {t.label.split(" ")[0]}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your note..."
            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none h-20 focus:outline-none focus:border-accent"
          />
          <div className="flex justify-between mt-2">
            <button onClick={() => setOpen(false)} className="text-xs text-muted hover:text-foreground">Cancel</button>
            <button onClick={handleSave} disabled={saving || !content.trim()} className="text-xs bg-accent text-white px-3 py-1 rounded-lg disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {existingNotes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {existingNotes.map((n) => {
                const type = NOTE_TYPES.find((t) => t.type === n.noteType);
                return (
                  <div key={n.id} className="flex items-start gap-2 text-xs">
                    <span>{type?.icon}</span>
                    <span className="flex-1 text-muted">{n.content}</span>
                    <button onClick={() => onDelete?.(n.id)} className="text-danger/50 hover:text-danger shrink-0">x</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
