import { VoiceAssignment, Character } from "@/types";

// Gemini TTS voice presets — full 30-voice catalog mapped by characteristics
const GEMINI_VOICES: Record<
  string,
  { id: string; name: string; gender: string; age: string; accent: string }[]
> = {
  "male-adult": [
    { id: "Charon", name: "Charon", gender: "male", age: "adult", accent: "General American" }, // informative
    { id: "Orus", name: "Orus", gender: "male", age: "adult", accent: "General American" }, // firm
    { id: "Enceladus", name: "Enceladus", gender: "male", age: "adult", accent: "General American" }, // breathy
    { id: "Iapetus", name: "Iapetus", gender: "male", age: "adult", accent: "General American" }, // clear
    { id: "Algieba", name: "Algieba", gender: "male", age: "adult", accent: "General American" }, // smooth
    { id: "Rasalgethi", name: "Rasalgethi", gender: "male", age: "adult", accent: "General American" }, // informative
    { id: "Alnilam", name: "Alnilam", gender: "male", age: "adult", accent: "General American" }, // firm
    { id: "Sadaltager", name: "Sadaltager", gender: "male", age: "adult", accent: "General American" }, // knowledgeable
  ],
  "male-young-adult": [
    { id: "Puck", name: "Puck", gender: "male", age: "young-adult", accent: "General American" }, // upbeat
    { id: "Fenrir", name: "Fenrir", gender: "male", age: "young-adult", accent: "General American" }, // excitable
    { id: "Achird", name: "Achird", gender: "male", age: "young-adult", accent: "General American" }, // friendly
    { id: "Zubenelgenubi", name: "Zubenelgenubi", gender: "male", age: "young-adult", accent: "General American" }, // casual
  ],
  "male-elderly": [
    { id: "Umbriel", name: "Umbriel", gender: "male", age: "elderly", accent: "General American" }, // easy-going
    { id: "Algenib", name: "Algenib", gender: "male", age: "elderly", accent: "General American" }, // gravelly
    { id: "Gacrux", name: "Gacrux", gender: "male", age: "elderly", accent: "General American" }, // mature
    { id: "Schedar", name: "Schedar", gender: "male", age: "elderly", accent: "General American" }, // even
  ],
  "female-adult": [
    { id: "Kore", name: "Kore", gender: "female", age: "adult", accent: "General American" }, // firm
    { id: "Aoede", name: "Aoede", gender: "female", age: "adult", accent: "General American" }, // breezy
    { id: "Callirrhoe", name: "Callirrhoe", gender: "female", age: "adult", accent: "General American" }, // easy-going
    { id: "Despina", name: "Despina", gender: "female", age: "adult", accent: "General American" }, // smooth
    { id: "Erinome", name: "Erinome", gender: "female", age: "adult", accent: "General American" }, // clear
    { id: "Sulafat", name: "Sulafat", gender: "female", age: "adult", accent: "General American" }, // warm
  ],
  "female-young-adult": [
    { id: "Leda", name: "Leda", gender: "female", age: "young-adult", accent: "General American" }, // youthful
    { id: "Laomedeia", name: "Laomedeia", gender: "female", age: "young-adult", accent: "General American" }, // upbeat
    { id: "Sadachbia", name: "Sadachbia", gender: "female", age: "young-adult", accent: "General American" }, // lively
    { id: "Pulcherrima", name: "Pulcherrima", gender: "female", age: "young-adult", accent: "General American" }, // forward
  ],
  "female-elderly": [
    { id: "Autonoe", name: "Autonoe", gender: "female", age: "elderly", accent: "General American" }, // bright
    { id: "Achernar", name: "Achernar", gender: "female", age: "elderly", accent: "General American" }, // soft
    { id: "Vindemiatrix", name: "Vindemiatrix", gender: "female", age: "elderly", accent: "General American" }, // gentle
  ],
  "neutral-adult": [
    { id: "Zephyr", name: "Zephyr", gender: "neutral", age: "adult", accent: "General American" }, // bright
  ],
};

const ACCENT_OPTIONS = [
  "General American",
  "British RP",
  "Cockney",
  "Scottish",
  "Irish",
  "Australian",
  "New York",
  "Southern US",
  "Midwestern US",
  "French",
  "German",
  "Spanish",
  "Italian",
];

const AGE_OPTIONS: VoiceAssignment["age"][] = [
  "child",
  "young-adult",
  "adult",
  "elderly",
];

export { ACCENT_OPTIONS, AGE_OPTIONS };

export function getDefaultVoiceAssignment(
  character: Character,
  index: number
): VoiceAssignment {
  const key = `${character.suggestedGender}-${character.suggestedAge}`;
  const voices = GEMINI_VOICES[key] || GEMINI_VOICES["neutral-adult"];
  const voice = voices[index % voices.length];

  return {
    characterName: character.name,
    voiceId: voice.id,
    voiceName: voice.name,
    gender: character.suggestedGender,
    age: character.suggestedAge,
    accent: character.suggestedAccent,
    pitch: 1.0,
    rate: 1.0,
  };
}

export function getVoicesForCategory(
  gender: string,
  age: string
): { id: string; name: string; accent: string }[] {
  const key = `${gender}-${age}`;
  return (
    GEMINI_VOICES[key]?.map((v) => ({
      id: v.id,
      name: v.name,
      accent: v.accent,
    })) || []
  );
}

// Web Speech API fallback for browser TTS
export class BrowserVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    if (this.voices.length === 0) {
      this.synth.addEventListener("voiceschanged", () => {
        this.voices = this.synth!.getVoices();
      });
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  speak(
    text: string,
    assignment: VoiceAssignment,
    onEnd?: () => void
  ): SpeechSynthesisUtterance | null {
    if (!this.synth) {
      // No synth — don't hang the rehearsal; advance immediately so the user
      // isn't stuck on a silent line forever.
      onEnd?.();
      return null;
    }

    const synth = this.synth;
    const buildUtterance = () => {
      const u = new SpeechSynthesisUtterance(text);
      const preferredVoice = this.voices.find((v) => v.lang.startsWith("en"));
      if (preferredVoice) u.voice = preferredVoice;
      const pitchMap: Record<string, number> = {
        child: 1.5,
        "young-adult": 1.1,
        adult: 1.0,
        elderly: 0.85,
      };
      u.pitch = (pitchMap[assignment.age] || 1.0) * assignment.pitch;
      // Clamp rate. Emotion adjustments can push assignment.rate as low as
      // ~0.7, which sounds painfully slow for short cue lines like Nurse's
      // "Madam!". Floor at 0.9 so character emotion still varies but no
      // utterance is below natural conversational pace.
      u.rate = Math.min(1.6, Math.max(0.9, assignment.rate));
      return u;
    };

    // Chrome quirk: after the synth has been idle or recently cancelled,
    // synth.speak() can fire `end` immediately without `start` ever firing,
    // making the utterance silent. Track whether `start` actually fired and
    // retry once if not. Listen for `error` so we never hang on a cancelled
    // utterance either.
    let endedFired = false;
    let attempts = 0;
    const fireEndOnce = () => {
      if (endedFired) return;
      endedFired = true;
      onEnd?.();
    };

    const tryOnce = () => {
      attempts += 1;
      const utterance = buildUtterance();
      let started = false;
      utterance.addEventListener("start", () => {
        started = true;
      });
      utterance.addEventListener("end", () => {
        if (!started && attempts < 2) {
          synth.cancel();
          setTimeout(tryOnce, 120);
          return;
        }
        fireEndOnce();
      });
      utterance.addEventListener("error", () => {
        fireEndOnce();
      });
      synth.speak(utterance);
      return utterance;
    };

    return tryOnce();
  }

  stop() {
    this.synth?.cancel();
  }

  pause() {
    this.synth?.pause();
  }

  resume() {
    this.synth?.resume();
  }
}

// Factory: fetch config and return the best available engine.
// Pass `demoSceneId` to play pre-recorded audio for a famous-scene demo —
// this skips the server entirely (no auth, no credits) and reads from
// /public/demo-audio/<sceneId>/.
export async function createVoiceEngine(
  opts?: { demoSceneId?: string }
): Promise<BrowserVoiceEngine | GeminiVoiceEngine | DemoVoiceEngine> {
  if (opts?.demoSceneId) {
    return new DemoVoiceEngine(opts.demoSceneId);
  }
  try {
    const res = await fetch("/api/voice/config");
    if (res.ok) {
      const { engine } = await res.json();
      if (engine === "gemini") {
        return new GeminiVoiceEngine();
      }
    }
  } catch {
    // Fall through to browser engine
  }
  return new BrowserVoiceEngine();
}

// Plays pre-recorded demo audio. Falls back to BrowserVoiceEngine for any
// line not in the manifest (e.g. emotion-adjusted text variants we didn't
// pre-record), so the demo never hard-stops.
export class DemoVoiceEngine {
  private sceneId: string;
  private manifestPromise: Promise<void>;
  private byKey = new Map<string, string>();
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private browserFallback: BrowserVoiceEngine;

  constructor(sceneId: string) {
    this.sceneId = sceneId;
    this.browserFallback = new BrowserVoiceEngine();
    this.manifestPromise = this.loadManifest();
  }

  private async loadManifest(): Promise<void> {
    try {
      const res = await fetch(`/demo-audio/${this.sceneId}/manifest.json`);
      if (!res.ok) return;
      const m = (await res.json()) as {
        lines: Record<string, { file: string; text: string; voiceId: string }>;
      };
      for (const info of Object.values(m.lines)) {
        this.byKey.set(`${info.voiceId}::${info.text}`, info.file);
      }
    } catch {
      // Manifest absent — every line will fall back to browser TTS
    }
  }

  speak(
    text: string,
    assignment: VoiceAssignment,
    onEnd?: () => void
  ): null {
    this.speakAsync(text, assignment, onEnd).catch(() => {
      this.browserFallback.speak(text, assignment, onEnd);
    });
    return null;
  }

  private async speakAsync(
    text: string,
    assignment: VoiceAssignment,
    onEnd?: () => void
  ): Promise<void> {
    await this.manifestPromise;
    const key = `${assignment.voiceId}::${text}`;
    const file = this.byKey.get(key);
    if (!file) {
      throw new Error(`No demo audio for line in scene ${this.sceneId}`);
    }

    const audioRes = await fetch(`/demo-audio/${this.sceneId}/${file}`);
    if (!audioRes.ok) {
      throw new Error(`Demo audio fetch failed: ${audioRes.status}`);
    }
    const buffer = await audioRes.arrayBuffer();

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    const pcm = new Int16Array(buffer);
    const floats = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
      floats[i] = pcm[i] / 32768;
    }
    const audioBuffer = this.audioContext.createBuffer(1, floats.length, 24000);
    audioBuffer.getChannelData(0).set(floats);

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.playbackRate.value = assignment.rate ?? 1.0;
    this.currentSource.connect(this.audioContext.destination);
    if (onEnd) {
      this.currentSource.addEventListener("ended", onEnd);
    }
    this.currentSource.start();
  }

  stop() {
    this.currentSource?.stop();
    this.currentSource = null;
    this.browserFallback.stop();
  }

  pause() {
    this.audioContext?.suspend();
  }

  resume() {
    this.audioContext?.resume();
  }
}

// Gemini TTS via server proxy — same speak(text, assignment, onEnd) interface as BrowserVoiceEngine.
// The proxy enforces voice-credit limits and keeps the Gemini API key off the client.
export class GeminiVoiceEngine {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private browserFallback: BrowserVoiceEngine;

  constructor() {
    this.browserFallback = new BrowserVoiceEngine();
  }

  speak(
    text: string,
    assignment: VoiceAssignment,
    onEnd?: () => void
  ): null {
    this.speakAsync(text, assignment, onEnd).catch((err) => {
      // Out-of-credits and upstream errors both fall back to browser TTS so the
      // rehearsal flow keeps moving. Credits are already enforced server-side, so
      // the fallback can't re-trigger Gemini billing.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("voice:fallback", { detail: { code: err?.code, message: err?.message } }));
      }
      this.browserFallback.speak(text, assignment, onEnd);
    });
    return null;
  }

  private async speakAsync(
    text: string,
    assignment: VoiceAssignment,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const response = await fetch("/api/voice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId: assignment.voiceId }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const err = new Error(body?.error || `TTS proxy error: ${response.status}`) as Error & { code?: string; status?: number };
      err.code = body?.code;
      err.status = response.status;
      throw err;
    }

    const { audioBase64 } = await response.json();
    if (!audioBase64) {
      throw new Error("No audio data in TTS response");
    }

    // Gemini returns L16 PCM at 24000 Hz — decode to AudioBuffer
    const raw = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const pcm = new Int16Array(raw.buffer);
    const floats = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
      floats[i] = pcm[i] / 32768;
    }

    const sampleRate = 24000;
    const audioBuffer = this.audioContext.createBuffer(1, floats.length, sampleRate);
    audioBuffer.getChannelData(0).set(floats);

    // Apply playback rate from assignment
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.playbackRate.value = assignment.rate ?? 1.0;
    this.currentSource.connect(this.audioContext.destination);

    if (onEnd) {
      this.currentSource.addEventListener("ended", onEnd);
    }

    this.currentSource.start();
  }

  stop() {
    this.currentSource?.stop();
    this.currentSource = null;
    this.browserFallback.stop();
  }

  pause() {
    this.audioContext?.suspend();
  }

  resume() {
    this.audioContext?.resume();
  }
}
