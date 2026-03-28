import { Character, ScriptLine, ParsedScript } from "@/types";

// Common patterns for script formatting
const CHARACTER_NAME_PATTERN = /^([A-Z][A-Z\s.'-]{1,30})(?:\s*[:(]|$)/;
const STAGE_DIRECTION_PATTERN = /^\s*\[(.+)\]\s*$|^\s*\((.+)\)\s*$/;
const ACT_PATTERN = /^(?:ACT\s+(\w+)|Act\s+(\w+))/i;
const SCENE_PATTERN = /^(?:SCENE\s+(\w+)|Scene\s+(\w+))/i;

function romanToNumber(roman: string): number {
  const map: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5,
    ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  };
  return map[roman.toUpperCase()] || 1;
}

function estimateLength(pageCount: number): ParsedScript["estimatedLength"] {
  if (pageCount <= 15) return "short-episode";
  if (pageCount <= 40) return "one-act";
  return "three-act";
}

export function parseScript(text: string, fileName: string): ParsedScript {
  const lines = text.split("\n");
  const scriptLines: ScriptLine[] = [];
  const characterMap = new Map<string, { lineCount: number }>();

  let currentAct = 1;
  let currentScene = 1;
  let currentCharacter: string | null = null;
  let lineIdCounter = 0;

  // Estimate pages (~55 lines per page for scripts)
  const pageCount = Math.max(1, Math.ceil(lines.length / 55));

  // First pass: detect title (usually first non-empty line)
  let title = fileName.replace(/\.(txt|pdf)$/i, "").replace(/[-_]/g, " ");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("#")) {
      if (trimmed.length < 80) {
        title = trimmed;
      }
      break;
    }
  }

  // Main parse pass
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) continue;

    // Check for act markers
    const actMatch = trimmed.match(ACT_PATTERN);
    if (actMatch) {
      const actVal = actMatch[1] || actMatch[2];
      currentAct = romanToNumber(actVal);
      currentScene = 1;
      continue;
    }

    // Check for scene markers
    const sceneMatch = trimmed.match(SCENE_PATTERN);
    if (sceneMatch) {
      const sceneVal = sceneMatch[1] || sceneMatch[2];
      currentScene = romanToNumber(sceneVal);
      continue;
    }

    // Check for stage directions
    const stageMatch = trimmed.match(STAGE_DIRECTION_PATTERN);
    if (stageMatch) {
      scriptLines.push({
        id: `line-${lineIdCounter++}`,
        type: "stage-direction",
        text: stageMatch[1] || stageMatch[2],
        act: currentAct,
        scene: currentScene,
      });
      continue;
    }

    // Check for character name (dialogue start)
    const charMatch = trimmed.match(CHARACTER_NAME_PATTERN);
    if (charMatch) {
      const name = charMatch[1].trim();
      // Filter out common false positives
      const falsePositives = [
        "ACT", "SCENE", "INT", "EXT", "CUT", "FADE", "THE", "END",
        "CONTINUED", "CONT", "MORE", "LIGHTS", "CURTAIN", "BLACKOUT",
      ];
      if (!falsePositives.includes(name)) {
        currentCharacter = name;
        if (!characterMap.has(name)) {
          characterMap.set(name, { lineCount: 0 });
        }

        // Get the dialogue text (might be on same line or next line)
        let dialogueText = trimmed.slice(charMatch[0].length).trim();
        // Remove leading colon or parenthetical direction
        dialogueText = dialogueText.replace(/^[:\s]+/, "");

        if (!dialogueText && i + 1 < lines.length) {
          // Dialogue is on the next line(s)
          let j = i + 1;
          const dialogueParts: string[] = [];
          while (j < lines.length) {
            const nextLine = lines[j].trim();
            if (
              !nextLine ||
              nextLine.match(CHARACTER_NAME_PATTERN) ||
              nextLine.match(STAGE_DIRECTION_PATTERN) ||
              nextLine.match(ACT_PATTERN) ||
              nextLine.match(SCENE_PATTERN)
            ) {
              break;
            }
            dialogueParts.push(nextLine);
            j++;
          }
          dialogueText = dialogueParts.join(" ");
          i = j - 1;
        }

        if (dialogueText) {
          characterMap.get(name)!.lineCount++;
          scriptLines.push({
            id: `line-${lineIdCounter++}`,
            type: "dialogue",
            character: name,
            text: dialogueText,
            act: currentAct,
            scene: currentScene,
          });
        }
        continue;
      }
    }

    // Continuation of previous character's dialogue
    if (currentCharacter && trimmed) {
      const lastLine = scriptLines[scriptLines.length - 1];
      if (lastLine && lastLine.type === "dialogue" && lastLine.character === currentCharacter) {
        lastLine.text += " " + trimmed;
      } else {
        characterMap.get(currentCharacter)!.lineCount++;
        scriptLines.push({
          id: `line-${lineIdCounter++}`,
          type: "dialogue",
          character: currentCharacter,
          text: trimmed,
          act: currentAct,
          scene: currentScene,
        });
      }
    }
  }

  // Build character list
  const characters: Character[] = Array.from(characterMap.entries())
    .map(([name, data]) => ({
      name,
      lineCount: data.lineCount,
      suggestedGender: guessGender(name),
      suggestedAge: "adult" as const,
      suggestedAccent: "General American",
    }))
    .sort((a, b) => b.lineCount - a.lineCount);

  const actCount = Math.max(
    currentAct,
    ...scriptLines.map((l) => l.act || 1)
  );

  return {
    title,
    characters,
    lines: scriptLines,
    actCount,
    sceneCount: currentScene,
    estimatedLength: estimateLength(pageCount),
    pageCount,
  };
}

function guessGender(name: string): Character["suggestedGender"] {
  const femaleNames = [
    "MARY", "JULIET", "OPHELIA", "LADY", "MRS", "QUEEN", "PRINCESS",
    "MOTHER", "SISTER", "AUNT", "GIRL", "WOMAN", "DUCHESS", "MAID",
    "NURSE", "WIFE", "DAUGHTER", "ANNA", "MARIA", "KATE", "KATHERINE",
    "ELIZABETH", "JANE", "SARAH", "EMILY", "ALICE", "HELEN", "ROSE",
    "MARGARET", "VIOLA", "PORTIA", "MIRANDA", "TITANIA", "HERMIA",
    "DESDEMONA", "CORDELIA", "BEATRICE", "ROSALIND", "CLEOPATRA",
  ];
  const maleNames = [
    "MR", "KING", "PRINCE", "LORD", "SIR", "FATHER", "BROTHER",
    "UNCLE", "BOY", "MAN", "DUKE", "CAPTAIN", "GENERAL", "DOCTOR",
    "ROMEO", "HAMLET", "MACBETH", "OTHELLO", "LEAR", "PROSPERO",
    "JOHN", "JAMES", "WILLIAM", "HENRY", "GEORGE", "RICHARD", "TOM",
    "JACK", "MARK", "PETER", "PAUL", "DAVID", "ROBERT", "CHARLES",
  ];

  const upper = name.toUpperCase();
  if (femaleNames.some((n) => upper.includes(n))) return "female";
  if (maleNames.some((n) => upper.includes(n))) return "male";
  return "neutral";
}

export function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        resolve(text);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsText(file);
  });
}
