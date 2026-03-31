import type { ScriptLine, ScriptAnalysis, Character } from "@/types";

const GENRE_MARKERS: Record<string, string[]> = {
  tragedy: ["death", "die", "kill", "murder", "doom", "fate", "blood", "revenge", "curse", "funeral", "tomb", "poison"],
  comedy: ["laugh", "jest", "fool", "merry", "joke", "wit", "ridiculous", "absurd", "comical", "wedding", "celebrate"],
  romance: ["love", "heart", "kiss", "passion", "desire", "beloved", "darling", "sweetheart", "marry", "wedding"],
  thriller: ["danger", "escape", "gun", "chase", "hide", "secret", "betray", "suspect", "evidence", "murder"],
  drama: ["family", "truth", "lie", "remember", "promise", "forgive", "regret", "change", "father", "mother"],
  historical: ["king", "queen", "war", "battle", "kingdom", "throne", "empire", "lord", "honour", "sword"],
};

const TONE_MARKERS: Record<string, string[]> = {
  dark: ["shadow", "darkness", "blood", "death", "fear", "cold", "grave", "doom", "despair", "sinister"],
  light: ["sun", "bright", "laugh", "joy", "happy", "warm", "smile", "gentle", "sweet", "cheerful"],
  tense: ["wait", "listen", "careful", "danger", "hurry", "stop", "watch", "quiet", "run", "hide"],
  intimate: ["whisper", "touch", "close", "softly", "alone", "together", "hold", "gentle", "tender"],
  comedic: ["ridiculous", "absurd", "fool", "laugh", "joke", "hilarious", "silly", "stupid", "funny"],
  melancholic: ["remember", "once", "gone", "lost", "miss", "used to", "never again", "farewell", "lonely"],
};

export function analyzeScript(
  lines: ScriptLine[],
  characters: Character[]
): ScriptAnalysis {
  const allText = lines.map((l) => l.text.toLowerCase()).join(" ");
  const dialogueLines = lines.filter((l) => l.type === "dialogue");
  const totalWords = allText.split(/\s+/).length;

  // Detect genre
  const genreScores: Record<string, number> = {};
  for (const [genre, markers] of Object.entries(GENRE_MARKERS)) {
    genreScores[genre] = markers.reduce(
      (score, marker) => score + (allText.split(marker).length - 1),
      0
    );
  }
  const genre = Object.entries(genreScores).sort((a, b) => b[1] - a[1])[0][0];

  // Detect tone
  const toneScores: Record<string, number> = {};
  for (const [tone, markers] of Object.entries(TONE_MARKERS)) {
    toneScores[tone] = markers.reduce(
      (score, marker) => score + (allText.split(marker).length - 1),
      0
    );
  }
  const tone = Object.entries(toneScores).sort((a, b) => b[1] - a[1])[0][0];

  // Character arcs
  const characterArcs: Record<string, string> = {};
  for (const char of characters) {
    const charLines = dialogueLines.filter((l) => l.character === char.name);
    if (charLines.length === 0) continue;

    const firstThird = charLines.slice(0, Math.ceil(charLines.length / 3));
    const lastThird = charLines.slice(-Math.ceil(charLines.length / 3));

    const earlyEmotions = detectDominantEmotion(firstThird);
    const lateEmotions = detectDominantEmotion(lastThird);

    if (earlyEmotions !== lateEmotions) {
      characterArcs[char.name] = `${char.name} begins the scene in a state of ${earlyEmotions} and transitions toward ${lateEmotions} by the end. This emotional journey spans ${charLines.length} lines and suggests a significant internal shift.`;
    } else {
      characterArcs[char.name] = `${char.name} maintains a consistent ${earlyEmotions} register throughout the scene across ${charLines.length} lines. Look for subtle variations within this emotional baseline.`;
    }
  }

  // Key beats - moments where the energy or subject shifts
  const keyBeats: { lineId: string; description: string }[] = [];
  const turningPoints: { lineId: string; description: string }[] = [];

  for (let i = 1; i < dialogueLines.length; i++) {
    const prev = dialogueLines[i - 1];
    const curr = dialogueLines[i];

    // Character change after long speech
    if (prev.character !== curr.character && prev.text.split(/\s+/).length > 30) {
      keyBeats.push({
        lineId: curr.id,
        description: `Beat shift: ${curr.character} responds after ${prev.character}'s extended speech. This is a moment of reaction.`,
      });
    }

    // Question followed by a non-question
    if (prev.text.trim().endsWith("?") && !curr.text.trim().endsWith("?")) {
      if (curr.text.split(/\s+/).length > 15) {
        turningPoints.push({
          lineId: curr.id,
          description: `${curr.character} delivers a significant answer to ${prev.character}'s question. This response may shift the direction of the scene.`,
        });
      }
    }

    // Exclamation marks suggesting emotional peaks
    const exclamations = (curr.text.match(/!/g) || []).length;
    if (exclamations >= 2) {
      keyBeats.push({
        lineId: curr.id,
        description: `Emotional peak: ${curr.character}'s heightened intensity suggests a climactic moment.`,
      });
    }
  }

  // Voice profiles
  const suggestedVoiceProfiles: Record<string, { age: string; gender: string; accent: string }> = {};
  for (const char of characters) {
    suggestedVoiceProfiles[char.name] = {
      age: char.suggestedAge,
      gender: char.suggestedGender,
      accent: char.suggestedAccent,
    };
  }

  // Memorisation difficulty
  const avgLineLength = totalWords / Math.max(dialogueLines.length, 1);
  const uniqueCharacters = characters.length;
  let memorisationDifficulty: ScriptAnalysis["memorisationDifficulty"] = "easy";
  if (avgLineLength > 30 || uniqueCharacters > 6) memorisationDifficulty = "very-hard";
  else if (avgLineLength > 20 || uniqueCharacters > 4) memorisationDifficulty = "hard";
  else if (avgLineLength > 12 || uniqueCharacters > 2) memorisationDifficulty = "moderate";

  const estimatedSessionsToMemorize = Math.max(
    3,
    Math.ceil(dialogueLines.length / 8) + (memorisationDifficulty === "very-hard" ? 5 : memorisationDifficulty === "hard" ? 3 : 1)
  );

  return {
    genre,
    tone,
    characterArcs,
    keyBeats: keyBeats.slice(0, 10),
    turningPoints: turningPoints.slice(0, 5),
    suggestedVoiceProfiles,
    memorisationDifficulty,
    estimatedSessionsToMemorize,
  };
}

function detectDominantEmotion(lines: ScriptLine[]): string {
  const emotionWords: Record<string, string[]> = {
    anger: ["hate", "fury", "rage", "damn", "curse", "betray"],
    tenderness: ["love", "darling", "gentle", "sweet", "tender", "heart"],
    sorrow: ["weep", "cry", "tears", "mourn", "lost", "farewell"],
    fear: ["afraid", "terror", "dread", "danger", "flee", "tremble"],
    hope: ["hope", "believe", "trust", "faith", "promise", "dream"],
    defiance: ["never", "refuse", "fight", "stand", "will not", "dare"],
    longing: ["wish", "miss", "want", "desire", "dream", "remember"],
    resolve: ["must", "will", "shall", "swear", "vow", "promise"],
  };

  const scores: Record<string, number> = {};
  const text = lines.map((l) => l.text.toLowerCase()).join(" ");

  for (const [emotion, words] of Object.entries(emotionWords)) {
    scores[emotion] = words.reduce(
      (score, word) => score + (text.includes(word) ? 1 : 0),
      0
    );
  }

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : "measured composure";
}
