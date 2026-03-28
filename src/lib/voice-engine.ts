import { VoiceAssignment, Character } from "@/types";

// ElevenLabs voice presets mapped by characteristics
const ELEVENLABS_VOICES: Record<
  string,
  { id: string; name: string; gender: string; age: string; accent: string }[]
> = {
  "male-adult": [
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male", age: "adult", accent: "General American" },
    { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", gender: "male", age: "adult", accent: "General American" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male", age: "adult", accent: "General American" },
    { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", gender: "male", age: "adult", accent: "General American" },
  ],
  "male-young-adult": [
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", gender: "male", age: "young-adult", accent: "General American" },
    { id: "GBv7mTt0atIp3Br8iCZE", name: "Thomas", gender: "male", age: "young-adult", accent: "British RP" },
  ],
  "male-elderly": [
    { id: "SOYHLrjzK2X1ezoPC6cr", name: "Harry", gender: "male", age: "elderly", accent: "General American" },
    { id: "ZQe5CZNOzWyzPSCn5a3c", name: "James", gender: "male", age: "elderly", accent: "British RP" },
  ],
  "female-adult": [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female", age: "adult", accent: "General American" },
    { id: "MF3mGyEYCl7XYWbV9V6O", name: "Emily", gender: "female", age: "adult", accent: "General American" },
    { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female", age: "adult", accent: "British RP" },
  ],
  "female-young-adult": [
    { id: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", gender: "female", age: "young-adult", accent: "General American" },
    { id: "oWAxZDx7w5VEj9dCyTzz", name: "Grace", gender: "female", age: "young-adult", accent: "General American" },
  ],
  "female-elderly": [
    { id: "ThT5KcBeYPX3keUQqHPh", name: "Dorothy", gender: "female", age: "elderly", accent: "General American" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "female", age: "elderly", accent: "General American" },
  ],
  "neutral-adult": [
    { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "neutral", age: "adult", accent: "General American" },
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
  const voices = ELEVENLABS_VOICES[key] || ELEVENLABS_VOICES["neutral-adult"];
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
    ELEVENLABS_VOICES[key]?.map((v) => ({
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

// ElevenLabs API integration
export class ElevenLabsVoiceEngine {
  private apiKey: string;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speak(
    text: string,
    voiceId: string,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioData = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(audioData);

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.audioContext.destination);

    if (onEnd) {
      this.currentSource.addEventListener("ended", onEnd);
    }

    this.currentSource.start();
  }

  stop() {
    this.currentSource?.stop();
    this.currentSource = null;
  }
}
