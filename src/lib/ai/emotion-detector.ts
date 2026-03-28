import type { ScriptLine } from "@/types";

export type Emotion = "anger" | "joy" | "sorrow" | "fear" | "love" | "disgust" | "surprise" | "neutral";
export type DeliveryModifier = "whisper" | "shout" | "sarcasm" | "none";

export interface EmotionTag {
  emotion: Emotion;
  confidence: number;
  modifier: DeliveryModifier;
}

const EMOTION_KEYWORDS: Record<Emotion, string[]> = {
  anger: ["hate", "fury", "rage", "damn", "curse", "kill", "destroy", "wrath", "revenge", "betray", "villain", "fool", "wretch", "fiend", "devil"],
  joy: ["love", "happy", "joy", "delight", "laugh", "merry", "celebrate", "wonderful", "beautiful", "sweet", "glad", "blessed", "paradise", "heaven"],
  sorrow: ["weep", "cry", "tears", "mourn", "grief", "sorrow", "woe", "alas", "pity", "death", "die", "dead", "lost", "farewell", "goodbye", "tragic"],
  fear: ["afraid", "fear", "terror", "dread", "ghost", "horror", "tremble", "shake", "flee", "danger", "dark", "shadow", "haunt", "doom"],
  love: ["love", "darling", "beloved", "heart", "kiss", "embrace", "adore", "desire", "passion", "tender", "gentle", "sweetheart", "fair", "beauty"],
  disgust: ["vile", "filth", "foul", "stink", "rot", "sick", "loathe", "repulsive", "hideous", "abomination", "wretched"],
  surprise: ["what", "impossible", "heavens", "mercy", "amazed", "astonish", "wonder", "sudden", "behold", "unbelievable"],
  neutral: [],
};

const DIRECTION_EMOTIONS: Record<string, { emotion: Emotion; modifier: DeliveryModifier }> = {
  angrily: { emotion: "anger", modifier: "none" },
  furiously: { emotion: "anger", modifier: "shout" },
  happily: { emotion: "joy", modifier: "none" },
  laughing: { emotion: "joy", modifier: "none" },
  crying: { emotion: "sorrow", modifier: "none" },
  weeping: { emotion: "sorrow", modifier: "none" },
  sobbing: { emotion: "sorrow", modifier: "whisper" },
  fearfully: { emotion: "fear", modifier: "whisper" },
  trembling: { emotion: "fear", modifier: "whisper" },
  whispering: { emotion: "neutral", modifier: "whisper" },
  softly: { emotion: "neutral", modifier: "whisper" },
  quietly: { emotion: "neutral", modifier: "whisper" },
  shouting: { emotion: "anger", modifier: "shout" },
  yelling: { emotion: "anger", modifier: "shout" },
  screaming: { emotion: "fear", modifier: "shout" },
  lovingly: { emotion: "love", modifier: "none" },
  tenderly: { emotion: "love", modifier: "whisper" },
  sarcastically: { emotion: "neutral", modifier: "sarcasm" },
  mockingly: { emotion: "disgust", modifier: "sarcasm" },
  surprised: { emotion: "surprise", modifier: "none" },
  aside: { emotion: "neutral", modifier: "whisper" },
};

export function detectEmotion(line: ScriptLine, surroundingLines?: ScriptLine[]): EmotionTag {
  const text = line.text.toLowerCase();

  // Check for parenthetical stage directions within dialogue
  const directionMatch = text.match(/\(([^)]+)\)/);
  if (directionMatch) {
    const direction = directionMatch[1].toLowerCase();
    for (const [keyword, tag] of Object.entries(DIRECTION_EMOTIONS)) {
      if (direction.includes(keyword)) {
        return { ...tag, confidence: 0.9 };
      }
    }
  }

  // Count keyword matches per emotion
  const scores: Record<Emotion, number> = {
    anger: 0, joy: 0, sorrow: 0, fear: 0, love: 0, disgust: 0, surprise: 0, neutral: 0,
  };

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[emotion as Emotion] += 1;
      }
    }
  }

  // Detect modifiers from punctuation/formatting
  let modifier: DeliveryModifier = "none";
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const allCaps = text === text.toUpperCase() && text.length > 5;

  if (allCaps || exclamations >= 3) modifier = "shout";

  // Find highest scoring emotion
  let maxEmotion: Emotion = "neutral";
  let maxScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion as Emotion;
    }
  }

  // Boost anger/surprise from exclamations
  if (exclamations >= 2 && maxEmotion === "neutral") {
    maxEmotion = "anger";
    maxScore = 1;
  }
  if (questions >= 2 && maxEmotion === "neutral") {
    maxEmotion = "surprise";
    maxScore = 1;
  }

  const confidence = maxScore === 0 ? 0.3 : Math.min(0.95, 0.5 + maxScore * 0.15);

  return { emotion: maxEmotion, confidence, modifier };
}

export function detectAllEmotions(lines: ScriptLine[]): Map<string, EmotionTag> {
  const emotions = new Map<string, EmotionTag>();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type === "dialogue") {
      const surrounding = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
      emotions.set(lines[i].id, detectEmotion(lines[i], surrounding));
    }
  }
  return emotions;
}

// Voice modulation based on emotion
export function getEmotionVoiceAdjustment(tag: EmotionTag): { pitchDelta: number; rateDelta: number; volumeDelta: number } {
  const adjustments: Record<Emotion, { pitchDelta: number; rateDelta: number; volumeDelta: number }> = {
    anger: { pitchDelta: 0.2, rateDelta: 0.15, volumeDelta: 0.3 },
    joy: { pitchDelta: 0.15, rateDelta: 0.1, volumeDelta: 0.1 },
    sorrow: { pitchDelta: -0.15, rateDelta: -0.2, volumeDelta: -0.2 },
    fear: { pitchDelta: 0.1, rateDelta: 0.2, volumeDelta: -0.1 },
    love: { pitchDelta: -0.05, rateDelta: -0.1, volumeDelta: -0.15 },
    disgust: { pitchDelta: -0.1, rateDelta: -0.05, volumeDelta: 0.1 },
    surprise: { pitchDelta: 0.25, rateDelta: 0.1, volumeDelta: 0.2 },
    neutral: { pitchDelta: 0, rateDelta: 0, volumeDelta: 0 },
  };

  const base = adjustments[tag.emotion];

  // Apply modifier overrides
  if (tag.modifier === "whisper") return { pitchDelta: -0.1, rateDelta: -0.2, volumeDelta: -0.5 };
  if (tag.modifier === "shout") return { pitchDelta: base.pitchDelta + 0.1, rateDelta: base.rateDelta + 0.1, volumeDelta: 0.5 };
  if (tag.modifier === "sarcasm") return { pitchDelta: 0.05, rateDelta: -0.15, volumeDelta: 0 };

  return base;
}

export const EMOTION_COLORS: Record<Emotion, string> = {
  anger: "#e17055",
  joy: "#fdcb6e",
  sorrow: "#74b9ff",
  fear: "#a29bfe",
  love: "#fd79a8",
  disgust: "#00b894",
  surprise: "#ffeaa7",
  neutral: "#636e72",
};
