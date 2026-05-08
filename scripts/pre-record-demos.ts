// One-time pre-recording pass for demo scenes.
//
// For each scene in FAMOUS_SCENES, generates Gemini TTS audio for every
// dialogue line using the default voice assignment for that character,
// and writes the raw 24kHz mono PCM (signed 16-bit LE) to:
//
//   public/demo-audio/<sceneId>/<lineId>.pcm
//
// Plus a manifest at public/demo-audio/<sceneId>/manifest.json that the
// browser-side DemoVoiceEngine uses to look up the right file at runtime.
//
// Idempotent: skips lines whose .pcm file already exists. Re-running after
// you add a new scene will only fetch the missing lines.
//
// Usage:
//   npm run demo:pre-record                  # default: just romeo-juliet-balcony
//   npm run demo:pre-record -- --scene=all
//   npm run demo:pre-record -- --scene=hamlet-to-be
//
// Requires GEMINI_API_KEY in env.

import { writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import "dotenv/config";
import { FAMOUS_SCENES } from "../src/lib/famous-scenes";
import { getDefaultVoiceAssignment } from "../src/lib/voice-engine";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Set GEMINI_API_KEY in env (e.g. via .env) to pre-record demos.");
  process.exit(1);
}

const PUBLIC_ROOT = resolve(process.cwd(), "public", "demo-audio");

interface LineEntry {
  file: string;
  text: string;
  voiceId: string;
  character: string;
}
interface SceneManifest {
  sceneId: string;
  title: string;
  generatedAt: string;
  characters: Record<string, string>;
  lines: Record<string, LineEntry>;
}

async function callGemini(text: string, voiceId: string): Promise<Uint8Array> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId } },
          },
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("No audio in Gemini response");
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

async function recordScene(scene: typeof FAMOUS_SCENES[number]) {
  const sceneDir = join(PUBLIC_ROOT, scene.id);
  await mkdir(sceneDir, { recursive: true });

  // Pin a default voice per character — same logic the demo page uses
  const characters: Record<string, string> = {};
  scene.script.characters.forEach((c, i) => {
    characters[c.name] = getDefaultVoiceAssignment(c, i).voiceId;
  });

  const manifest: SceneManifest = {
    sceneId: scene.id,
    title: scene.title,
    generatedAt: new Date().toISOString(),
    characters,
    lines: {},
  };

  const dialogue = scene.script.lines.filter(
    (l) => l.type === "dialogue" && l.character && l.text
  );

  let totalBytes = 0;
  let generated = 0;
  let cached = 0;

  for (const line of dialogue) {
    const voiceId = characters[line.character!];
    if (!voiceId) {
      console.log(`  [skip] ${line.id} — no voice mapped for ${line.character}`);
      continue;
    }
    const filename = `${line.id}.pcm`;
    const filepath = join(sceneDir, filename);
    const entry: LineEntry = {
      file: filename,
      text: line.text,
      voiceId,
      character: line.character!,
    };

    if (existsSync(filepath)) {
      const stats = await stat(filepath);
      totalBytes += stats.size;
      manifest.lines[line.id] = entry;
      cached++;
      continue;
    }

    process.stdout.write(`  [gen]  ${line.id} (${line.character}, ${voiceId})... `);
    try {
      const pcm = await callGemini(line.text, voiceId);
      await writeFile(filepath, pcm);
      totalBytes += pcm.length;
      manifest.lines[line.id] = entry;
      generated++;
      console.log(`${(pcm.length / 1024).toFixed(0)} KB`);
    } catch (err) {
      console.log(`FAILED: ${(err as Error).message}`);
    }
  }

  await writeFile(
    join(sceneDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
  const lineCount = Object.keys(manifest.lines).length;
  console.log(
    `  ${lineCount} lines · ${totalMB} MB · ${generated} new / ${cached} cached\n`
  );
}

function parseArgs(): { sceneFilter: string | null } {
  const sceneArg = process.argv.find((a) => a.startsWith("--scene="));
  return { sceneFilter: sceneArg ? sceneArg.slice("--scene=".length) : null };
}

async function main() {
  const { sceneFilter } = parseArgs();
  let scenes: typeof FAMOUS_SCENES;
  if (!sceneFilter) {
    scenes = FAMOUS_SCENES.slice(0, 1);
    console.log("(no --scene flag; recording just the first scene)\n");
  } else if (sceneFilter === "all") {
    scenes = FAMOUS_SCENES;
  } else {
    scenes = FAMOUS_SCENES.filter((s) => s.id === sceneFilter);
    if (scenes.length === 0) {
      console.error(
        `No scene with id "${sceneFilter}". Available: ${FAMOUS_SCENES.map((s) => s.id).join(", ")}`
      );
      process.exit(1);
    }
  }

  await mkdir(PUBLIC_ROOT, { recursive: true });
  for (const scene of scenes) {
    console.log(`${scene.title} (${scene.id})`);
    await recordScene(scene);
  }
  console.log(`Done. Files saved under public/demo-audio/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
