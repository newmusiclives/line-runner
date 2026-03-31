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

// Annotations (Feature 11 - Enhanced)
export type NoteType = 'personal' | 'blocking' | 'emotion' | 'director' | 'action' | 'exposition' | 'beat' | 'button';
export type HighlightColor = 'blue' | 'red' | 'purple' | 'green' | 'yellow' | 'orange' | 'pink' | 'cyan';

export interface Annotation {
  id: string;
  lineId: string;
  noteType: NoteType;
  content: string;
  highlightColor?: HighlightColor;
  voiceMemoUrl?: string;
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
  bio?: string;
  isVoiceActor?: boolean;
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
  genre?: string;
  tone?: string;
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

export type PlanType = 'free' | 'single-script' | 'one-act-pass' | 'three-act-pass' | 'monthly' | 'annual' | 'studio';

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

// ─── Feature 04: Script Analysis ───────────────────────────
export interface ScriptAnalysis {
  genre: string;
  tone: string;
  characterArcs: Record<string, string>;
  keyBeats: { lineId: string; description: string }[];
  turningPoints: { lineId: string; description: string }[];
  suggestedVoiceProfiles: Record<string, { age: string; gender: string; accent: string }>;
  memorisationDifficulty: 'easy' | 'moderate' | 'hard' | 'very-hard';
  estimatedSessionsToMemorize: number;
}

// ─── Feature 05: Line Memory Tracker ───────────────────────
export interface StumbleEvent {
  lineId: string;
  lineIndex: number;
  type: 'hesitation' | 'misread' | 'long-pause';
  sessionId: string;
  timestamp: string;
}

export interface LineHeatmapEntry {
  lineId: string;
  lineIndex: number;
  stumbleCount: number;
  severity: 'clean' | 'amber' | 'red';
  cleanStreak: number;
}

// ─── Feature 01: AI Performance Coach ──────────────────────
export interface PerformanceNote {
  id: string;
  sessionId: string;
  lineId: string;
  lineIndex: number;
  timestamp: number;
  note: string;
  category: 'pacing' | 'energy' | 'timing' | 'pause' | 'delivery';
  severity: 'positive' | 'suggestion' | 'critical';
}

// ─── Feature 02: Subtext Mode ──────────────────────────────
export interface SubtextConfig {
  characterName: string;
  subtextTag: string;
  custom?: boolean;
}

export const SUBTEXT_PRESETS = [
  'jealous', 'terrified', 'pretending to be calm', 'barely containing rage',
  'deeply in love', 'hiding guilt', 'desperate', 'amused',
  'contemptuous', 'grieving', 'suspicious', 'euphoric',
  'resigned', 'manipulative', 'protective', 'vulnerable',
] as const;

// ─── Feature 03: Emotional Arc Mapping ─────────────────────
export interface EmotionalArcPoint {
  lineIndex: number;
  lineId: string;
  character: string;
  intensity: number;
  emotion: Emotion;
  timestamp: number;
}

export interface EmotionalArc {
  sessionId: string;
  points: EmotionalArcPoint[];
}

// ─── Feature 06: Objective & Obstacle Mode ─────────────────
export interface ObjectiveObstacle {
  characterName: string;
  objective: string;
  obstacle: string;
}

export interface InterpretationConfig {
  id: string;
  name: string;
  scriptId: string;
  objectives: ObjectiveObstacle[];
  createdAt: string;
}

// ─── Feature 07: Relationship Dynamics ─────────────────────
export interface RelationshipDynamic {
  character1: string;
  character2: string;
  intimacy: number;      // 0-100
  powerBalance: number;  // -100 to +100 (negative = char1 subordinate)
  preset?: 'professional' | 'romantic' | 'adversarial' | 'family';
}

// ─── Feature 08: Wildcard Mode ─────────────────────────────
export const WILDCARD_MODIFIERS = [
  'distracted', 'urgent', 'playful', 'cold',
  'barely holding it together', 'contemptuous', 'tender', 'afraid',
  'exhausted', 'manic', 'seductive', 'bored',
] as const;
export type WildcardModifier = typeof WILDCARD_MODIFIERS[number];

// ─── Feature 09: Director's Cut Mode ───────────────────────
export interface DirectorCutNote {
  id: string;
  scriptId: string;
  lineId: string;
  lineIndex: number;
  audioUrl: string;
  directorName: string;
  directorId: string;
  noteSetName: string;
  createdAt: string;
}

// ─── Feature 10: Cold Read Mode ────────────────────────────
export interface ColdReadMetric {
  lineId: string;
  lineIndex: number;
  timeToDeliveryMs: number;
  wordAccuracy: number;
  firstContactCorrect: boolean;
}

// ─── Feature 12: Audition Vault ────────────────────────────
export interface VaultEntry {
  id: string;
  scriptId: string;
  scriptTitle: string;
  characterName: string;
  genre?: string;
  voiceConfig: string;
  keeperTakeIds: string[];
  createdAt: string;
  lastAccessedAt: string;
}

// ─── Feature 13: Pre-Audition Ritual ───────────────────────
export interface RitualPreset {
  id: string;
  name: string;
  breathInhale: number;
  breathHold: number;
  breathExhale: number;
  breathCycles: number;
  motivationalAudioUrl?: string;
  countdownSeconds: number;
}

// ─── Feature 14: Self-Tape Studio ──────────────────────────
export interface SelfTapeConfig {
  eyeLinePosition: { x: number; y: number };
  frameGridEnabled: boolean;
  autoSlate: boolean;
  actorName: string;
  projectName: string;
  characterName: string;
  takeNumber: number;
  aiVolumeInRecording: number;
  resolution: '720p' | '1080p' | '4k';
}

// ─── Feature 15: Sleep Learning Mode ───────────────────────
export interface SleepLearningConfig {
  playbackRate: number;       // 0.5 to 1.0
  mode: 'full' | 'cue-only' | 'whisper';
  sleepTimer: 30 | 60 | 90 | 120;
  fadeEnabled: boolean;
}

// ─── Feature 16: Voice Print Builder ───────────────────────
export type VoicePrintSegment =
  | 'conversational' | 'commercial' | 'dramatic' | 'character'
  | 'whisper-to-projection' | 'emotional-range' | 'technical'
  | 'narration' | 'promo' | 'e-learning' | 'medical' | 'podcast';

export interface VoicePrintSession {
  id: string;
  userId: string;
  status: 'in-progress' | 'completed' | 'submitted';
  segments: {
    type: VoicePrintSegment;
    status: 'pending' | 'recorded' | 'approved' | 'rejected';
    audioUrl?: string;
    qualityScore?: number;
    feedback?: string;
  }[];
  createdAt: string;
}

// ─── Feature 17: Scene Exchange ────────────────────────────
export interface SceneExchangeSession {
  id: string;
  scriptId: string;
  hostUserId: string;
  guestUserId?: string;
  status: 'waiting' | 'active' | 'completed';
  hostCharacter: string;
  guestCharacter?: string;
  createdAt: string;
}

// ─── Feature 18: Monologue Masterclass ─────────────────────
export interface MasterclassListing {
  id: string;
  sellerId: string;
  sellerName: string;
  scriptTitle: string;
  takeId: string;
  price: number;
  description: string;
  audioCommentaryUrl?: string;
  annotationNotes: string;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  createdAt: string;
}

// ─── Feature 19: Line Runner PASS ──────────────────────────
export interface ActorProfile {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  voiceSamples: string[];
  tier1Price: number;
  tier2Price: number;
  tier3Price: number;
  subscriberCount: number;
  totalEarnings: number;
}

export interface PassSubscription {
  id: string;
  fanUserId: string;
  actorUserId: string;
  tier: 1 | 2 | 3;
  monthlyPrice: number;
  status: 'active' | 'cancelled' | 'expired';
  startedAt: string;
}

// ─── Feature 20: Line Runner STUDIO ────────────────────────
export interface StudioDashboard {
  totalEarnings: number;
  monthlyEarnings: number;
  earningsByStream: {
    voiceLicensing: number;
    coaching: number;
    masterclass: number;
    passSubscriptions: number;
    clientDeliveries: number;
  };
  sessionAnalytics: {
    totalSessions: number;
    mostRehearsedScript: string;
    consistencyScore: number;
  };
  profileAnalytics: {
    fanGrowth: number;
    subscriberChurn: number;
    contentViews: number;
  };
}

// ─── Feature 21: Audio Quality Monitor ─────────────────────
export interface AudioQualityMetrics {
  noiseFloorDb: number;
  clippingEvents: number;
  proximityScore: number;
  roomConsistency: number;
  overallGrade: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface AudioQualityThresholds {
  noiseFloor: number;    // default: -50 dBFS
  clippingPeak: number;  // default: -3 dBFS
  proximityMin: number;
  proximityMax: number;
}

// ─── Feature 22: Pronunciation Coach ───────────────────────
export interface PronunciationEntry {
  word: string;
  ipa: string;
  referenceAudioUrl?: string;
  userAttemptUrl?: string;
  accuracy?: number;
  clientOrIndustry?: string;
}

// ─── Feature 23: Breath & Plosive Detector ─────────────────
export interface AudioIssue {
  id: string;
  type: 'plosive' | 'breath';
  timestampMs: number;
  severity: 'minor' | 'significant' | 'reject';
  durationMs: number;
}

// ─── Feature 24: ADR & Dubbing Mode ────────────────────────
export interface ADRSession {
  id: string;
  referenceAudioUrl: string;
  referenceVideoUrl?: string;
  scriptId: string;
  syncScore?: number;
  takes: {
    takeNumber: number;
    audioUrl: string;
    syncScore: number;
    createdAt: string;
  }[];
}

// ─── Feature 25: Copy Timing Calibrator ────────────────────
export interface CopyTimingConfig {
  targetDurationSec: number;
  personalWpmBaseline?: number;
}

export interface CopyTimingResult {
  actualDurationSec: number;
  wordsPerMinute: number;
  onTarget: boolean;
  delta: number;
}

// ─── Feature 26: Character Voice Consistency ───────────────
export interface VoiceProfile {
  id: string;
  projectId: string;
  characterName: string;
  pitchCenterSemitones: number;
  tempoSyllablesPerMin: number;
  dominantResonance: number;
  emotionalRegister: string;
  referenceAudioUrls: string[];
}

export interface ConsistencyScore {
  sessionId: string;
  score: number;
  grade: 'green' | 'amber' | 'red';
  deviations: {
    pitch: number;
    tempo: number;
    resonance: number;
  };
}

// ─── Feature 27: Demo Reel Producer ────────────────────────
export type DemoReelGenre = 'commercial' | 'corporate' | 'character' | 'promo' | 'audiobook' | 'e-learning' | 'medical';

export interface DemoReelProject {
  id: string;
  userId: string;
  status: 'in-progress' | 'assembled' | 'published';
  segments: {
    genre: DemoReelGenre;
    status: 'pending' | 'recorded' | 'approved';
    audioUrl?: string;
    musicBedId?: string;
  }[];
  finalAudioUrl?: string;
  profileUrl?: string;
  createdAt: string;
}

// ─── Feature 28: Client Delivery Portal ────────────────────
export interface ClientDelivery {
  id: string;
  voiceActorId: string;
  clientEmail: string;
  clientName: string;
  projectTitle: string;
  audioUrl: string;
  invoiceAmountCents: number;
  hoursWorked: number;
  hourlyRate: number;
  usageRightsType: string;
  usageRightsDuration?: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  deliveryLink: string;
  createdAt: string;
}

export const USAGE_RIGHTS_TYPES = [
  'Broadcast (TV/Radio)',
  'Online/Digital Only',
  'Internal Corporate',
  'Perpetuity (All Media)',
  'Time-Limited (1 Year)',
  'Time-Limited (2 Years)',
  'Regional Only',
  'Global All Media',
] as const;

// ─── Feature 29: Rate Calculator ───────────────────────────
export type VOJobType =
  | 'broadcast-tv' | 'national-radio' | 'e-learning' | 'audiobook'
  | 'video-game' | 'corporate-internal' | 'podcast-sponsorship'
  | 'commercial-digital' | 'promo-imaging' | 'medical-narration'
  | 'animation' | 'documentary';

export type UsageScope = 'local' | 'regional' | 'national' | 'global' | 'digital-only' | 'broadcast';

export interface RateQuote {
  jobType: VOJobType;
  usageScope: UsageScope;
  duration?: number;
  wordCount?: number;
  gvaaMinimum: number;
  marketMidpoint: number;
  premiumRate: number;
  suggestedQuote: number;
}

export interface NegotiationScript {
  scenario: string;
  response: string;
  strategy: 'hold-firm' | 'counter' | 'walk-away';
}

// ─── Feature 30: VO Genre Training ─────────────────────────
export type VOGenre = 'commercial' | 'audiobook' | 'e-learning' | 'character' | 'medical' | 'promo' | 'podcast';
export type CurriculumLevel = 1 | 2 | 3 | 4 | 5;

export interface CurriculumModule {
  genre: VOGenre;
  level: CurriculumLevel;
  scripts: {
    id: string;
    title: string;
    text: string;
    passCriteria: {
      consistencyMin: number;
      timingAccuracyMin: number;
      deliveryConfidenceMin: number;
    };
  }[];
}

export interface CurriculumProgress {
  userId: string;
  genre: VOGenre;
  currentLevel: CurriculumLevel;
  completedScripts: string[];
  certificationBadge?: string;
}
