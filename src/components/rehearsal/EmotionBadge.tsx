"use client";

import type { EmotionTag, Emotion } from "@/types";

const EMOTION_COLORS: Record<Emotion, string> = {
  anger: "bg-red-500/20 text-red-400 border-red-500/30",
  joy: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  sorrow: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fear: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  love: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  disgust: "bg-green-500/20 text-green-400 border-green-500/30",
  surprise: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const EMOTION_ICONS: Record<Emotion, string> = {
  anger: "🔥", joy: "✨", sorrow: "💧", fear: "😨",
  love: "❤️", disgust: "😤", surprise: "⚡", neutral: "—",
};

export function EmotionBadge({ tag, compact }: { tag: EmotionTag; compact?: boolean }) {
  if (tag.emotion === "neutral" && tag.confidence < 0.5) return null;

  const colorClass = EMOTION_COLORS[tag.emotion];
  const icon = EMOTION_ICONS[tag.emotion];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs border ${colorClass}`} title={`${tag.emotion} (${Math.round(tag.confidence * 100)}%)`}>
        {icon}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colorClass}`}>
      {icon} {tag.emotion}
      {tag.modifier !== "none" && (
        <span className="opacity-70">({tag.modifier})</span>
      )}
    </span>
  );
}
