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
    if (!this.synth) return null;

    const utterance = new SpeechSynthesisUtterance(text);

    // Try to match a voice based on gender and accent
    const preferredVoice = this.voices.find((v) => {
      const name = v.name.toLowerCase();
      if (assignment.gender === "female" && !name.includes("female") && !name.includes("samantha") && !name.includes("karen") && !name.includes("victoria")) {
        // Heuristic matching
      }
      return v.lang.startsWith("en");
    });

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Adjust pitch based on age
    const pitchMap: Record<string, number> = {
      child: 1.5,
      "young-adult": 1.1,
      adult: 1.0,
      elderly: 0.85,
    };
    utterance.pitch = (pitchMap[assignment.age] || 1.0) * assignment.pitch;
    utterance.rate = assignment.rate;

    if (onEnd) {
      utterance.addEventListener("end", onEnd);
    }

    this.synth.speak(utterance);
    return utterance;
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

// Factory: fetch config and return the best available engine
export async function createVoiceEngine(): Promise<BrowserVoiceEngine | GeminiVoiceEngine> {
  try {
    const res = await fetch("/api/voice/config");
    if (res.ok) {
      const { engine, apiKey } = await res.json();
      if (engine === "gemini" && apiKey) {
        return new GeminiVoiceEngine(apiKey);
      }
    }
  } catch {
    // Fall through to browser engine
  }
  return new BrowserVoiceEngine();
}

// Gemini TTS API integration — same speak(text, assignment, onEnd) interface as BrowserVoiceEngine
export class GeminiVoiceEngine {
  private apiKey: string;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private browserFallback: BrowserVoiceEngine;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.browserFallback = new BrowserVoiceEngine();
  }

  speak(
    text: string,
    assignment: VoiceAssignment,
    onEnd?: () => void
  ): null {
    this.speakAsync(text, assignment, onEnd).catch(() => {
      // Fall back to browser TTS on any Gemini error
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

    const voiceName = assignment.voiceId;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini TTS API error: ${response.status}`);
    }

    const data = await response.json();
    const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      throw new Error("No audio data in Gemini response");
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
