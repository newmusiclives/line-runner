export interface Character {
  name: string;
  lineCount: number;
  suggestedGender: 'male' | 'female' | 'neutral';
  suggestedAge: 'child' | 'young-adult' | 'adult' | 'elderly';
  suggestedAccent: string;
}

export interface ScriptLine {
  id: string;
  type: 'dialogue' | 'stage-direction';
  character?: string;
  text: string;
  act?: number;
  scene?: number;
}

export interface VoiceAssignment {
  characterName: string;
  voiceId: string;
  voiceName: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young-adult' | 'adult' | 'elderly';
  accent: string;
  pitch: number;
  rate: number;
}

export interface ParsedScript {
  title: string;
  characters: Character[];
  lines: ScriptLine[];
  actCount: number;
  sceneCount: number;
  estimatedLength: 'short-episode' | 'one-act' | 'three-act';
  pageCount: number;
}

export interface RehearsalSession {
  id: string;
  script: ParsedScript;
  scriptId?: string;
  myCharacter: string;
  myCharacters?: string[];
  voiceAssignments: VoiceAssignment[];
  currentLineIndex: number;
  isPlaying: boolean;
}

// Emotion system
export type Emotion = 'anger' | 'joy' | 'sorrow' | 'fear' | 'love' | 'disgust' | 'surprise' | 'neutral';
export type DeliveryModifier = 'whisper' | 'shout' | 'sarcasm' | 'none';

export interface EmotionTag {
  emotion: Emotion;
  confidence: number;
  modifier: DeliveryModifier;
}

// Annotations
export type NoteType = 'personal' | 'blocking' | 'emotion' | 'director';

export interface Annotation {
  id: string;
  lineId: string;
  noteType: NoteType;
  content: string;
  createdAt: string;
}

// Bookmarks
export interface SceneBookmark {
  id: string;
  label: string;
  startLineIdx: number;
  endLineIdx: number;
}

// Director Notes
export interface DirectorNoteItem {
  lineId: string;
  suggestion: string;
  category: 'pacing' | 'emotion' | 'subtext' | 'physicality' | 'general';
}

// Sound Effects
export interface SoundEffectCue {
  lineId: string;
  sfxFile: string;
  sfxName: string;
  volume: number;
}

// Performance
export interface PerformanceStats {
  totalRehearsalMinutes: number;
  linesMastered: number;
  fluencyScore: number;
  sessionStreak: number;
  improvementDelta: number;
  totalSessions: number;
}

export interface LineMetric {
  lineId: string;
  lineIndex: number;
  characterName: string;
  timingMs: number;
  skipped: boolean;
  replayed: boolean;
}

// User
export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

// Dashboard
export interface ScriptSummary {
  id: string;
  title: string;
  fileName: string;
  characterCount: number;
  lineCount: number;
  actCount: number;
  estimatedLength: string;
  createdAt: string;
  isFavorite: boolean;
  lastRehearsedAt?: string;
}

export interface RehearsalSessionSummary {
  id: string;
  scriptTitle: string;
  myCharacter: string;
  startedAt: string;
  durationSecs: number;
  linesCompleted: number;
  linesTotal: number;
}

export interface SubscriptionStatus {
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  minutesUsed: number;
  minutesIncluded: number;
  currentPeriodEnd: string;
}

export type PlanType = 'single-script' | 'one-act-pass' | 'three-act-pass' | 'monthly' | 'annual';

export interface PricingPlan {
  id: PlanType;
  name: string;
  price: number;
  period: 'one-time' | 'monthly' | 'annual';
  description: string;
  features: string[];
  scriptLengths: string[];
  maxCharacters: number;
  maxMinutes: number;
  costBreakdown: {
    voiceCostPerMin: number;
    includedMinutes: number;
    includedVoices: number;
    overagePerMin: number;
  };
  highlighted?: boolean;
}
