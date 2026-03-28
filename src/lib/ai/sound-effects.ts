import type { ScriptLine } from "@/types";

export interface SoundEffectCue {
  lineId: string;
  sfxFile: string;
  sfxName: string;
  volume: number;
}

const SFX_PATTERNS: { patterns: RegExp[]; file: string; name: string; defaultVolume: number }[] = [
  {
    patterns: [/door\s*(slam|close|shut|bang)/i, /slam.*door/i, /closes?\s*the\s*door/i],
    file: "/sfx/door-slam.mp3",
    name: "Door",
    defaultVolume: 0.7,
  },
  {
    patterns: [/phone\s*(ring|buzz)/i, /telephone/i, /cell\s*phone/i, /mobile\s*(ring|buzz)/i],
    file: "/sfx/phone-ring.mp3",
    name: "Phone Ring",
    defaultVolume: 0.6,
  },
  {
    patterns: [/thunder/i, /lightning/i, /storm/i],
    file: "/sfx/thunder.mp3",
    name: "Thunder",
    defaultVolume: 0.8,
  },
  {
    patterns: [/glass\s*(break|shatter|crash)/i, /shatter/i, /smash/i],
    file: "/sfx/glass-break.mp3",
    name: "Glass Break",
    defaultVolume: 0.7,
  },
  {
    patterns: [/applause/i, /clap/i, /ovation/i],
    file: "/sfx/applause.mp3",
    name: "Applause",
    defaultVolume: 0.6,
  },
  {
    patterns: [/footstep/i, /walk/i, /enter/i, /exit/i, /pace/i, /approach/i],
    file: "/sfx/footsteps.mp3",
    name: "Footsteps",
    defaultVolume: 0.4,
  },
  {
    patterns: [/knock/i, /rap\s*(on|at)/i],
    file: "/sfx/knock.mp3",
    name: "Knock",
    defaultVolume: 0.6,
  },
  {
    patterns: [/gun\s*shot/i, /fire[sd]?\s*(a\s*)?gun/i, /shot\s*(ring|fire|echo)/i, /pistol/i],
    file: "/sfx/gunshot.mp3",
    name: "Gunshot",
    defaultVolume: 0.8,
  },
  {
    patterns: [/crowd/i, /murmur/i, /chatter/i, /hubbub/i],
    file: "/sfx/crowd-murmur.mp3",
    name: "Crowd",
    defaultVolume: 0.4,
  },
  {
    patterns: [/wind/i, /howl/i, /breeze/i, /gust/i],
    file: "/sfx/wind.mp3",
    name: "Wind",
    defaultVolume: 0.5,
  },
  {
    patterns: [/bell/i, /chime/i, /clock\s*strike/i],
    file: "/sfx/bell.mp3",
    name: "Bell",
    defaultVolume: 0.5,
  },
  {
    patterns: [/scream/i, /shriek/i],
    file: "/sfx/scream.mp3",
    name: "Scream",
    defaultVolume: 0.7,
  },
];

export function detectSoundEffects(lines: ScriptLine[]): SoundEffectCue[] {
  const cues: SoundEffectCue[] = [];

  for (const line of lines) {
    if (line.type !== "stage-direction") continue;
    const text = line.text;

    for (const sfx of SFX_PATTERNS) {
      for (const pattern of sfx.patterns) {
        if (pattern.test(text)) {
          // Check for volume modifiers
          let volume = sfx.defaultVolume;
          if (/softly|quietly|gently|faint/i.test(text)) volume *= 0.5;
          if (/loud|bang|crash|BANG/i.test(text) || text === text.toUpperCase()) volume = Math.min(1, volume * 1.5);

          cues.push({
            lineId: line.id,
            sfxFile: sfx.file,
            sfxName: sfx.name,
            volume: Math.round(volume * 100) / 100,
          });
          break; // one SFX per line
        }
      }
    }
  }

  return cues;
}
