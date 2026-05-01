"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { parseScript, extractTextFromFile } from "@/lib/parse-script";
import {
  getDefaultVoiceAssignment,
  getVoicesForCategory,
  ACCENT_OPTIONS,
  AGE_OPTIONS,
} from "@/lib/voice-engine";
import type { ParsedScript, VoiceAssignment } from "@/types";

type Step = "upload" | "characters" | "voices";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus } = useSession();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [script, setScript] = useState<ParsedScript | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [myCharacter, setMyCharacter] = useState<string>("");
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment[]>(
    []
  );
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const persistScript = useCallback(
    async (parsed: ParsedScript, text: string, fileName: string) => {
      if (authStatus !== "authenticated") return null;
      try {
        const res = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: parsed.title,
            fileName,
            rawText: text,
            parsedData: JSON.stringify(parsed),
          }),
        });
        if (!res.ok) return null;
        const saved = await res.json();
        return saved.id as string;
      } catch {
        return null;
      }
    },
    [authStatus]
  );

  // Load existing saved script when ?scriptId=... is present
  useEffect(() => {
    const id = searchParams.get("scriptId");
    if (!id || authStatus !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [scriptRes, configRes] = await Promise.all([
          fetch(`/api/scripts/${id}`),
          fetch(`/api/scripts/${id}/config`),
        ]);
        if (!scriptRes.ok) {
          if (!cancelled) setError("Could not load saved script.");
          return;
        }
        const scriptData = await scriptRes.json();
        if (cancelled) return;
        setScript(scriptData.parsed_data as ParsedScript);
        setScriptId(scriptData.id);

        // If we have a saved character + voice assignments, jump straight to "voices"
        // so the user can review and tap Start Rehearsal without re-picking everything.
        if (configRes.ok) {
          const config = await configRes.json();
          if (cancelled) return;
          if (config.lastCharacter) {
            setMyCharacter(config.lastCharacter);
            if (Array.isArray(config.voiceAssignments) && config.voiceAssignments.length > 0) {
              setVoiceAssignments(
                config.voiceAssignments.map((a: { characterName: string; voiceConfig: VoiceAssignment }) => a.voiceConfig)
              );
              setStep("voices");
              return;
            }
            setStep("characters");
            return;
          }
        }
        setStep("characters");
      } catch {
        if (!cancelled) setError("Could not load saved script.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, authStatus]);

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setLoading(true);

    try {
      const validTypes = [
        "text/plain",
        "application/pdf",
        "text/x-script",
        "",
      ];
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "pdf") {
        // For PDF files, we extract text client-side using pdfjs
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => (item.str as string) || "")
            .join(" ");
          fullText += pageText + "\n\n";
        }
        const parsed = parseScript(fullText, file.name);
        setScript(parsed);
        const savedId = await persistScript(parsed, fullText, file.name);
        if (savedId) setScriptId(savedId);
        setStep("characters");
      } else if (
        ext === "txt" ||
        ext === "text" ||
        validTypes.includes(file.type)
      ) {
        const text = await extractTextFromFile(file);
        const parsed = parseScript(text, file.name);
        setScript(parsed);
        const savedId = await persistScript(parsed, text, file.name);
        if (savedId) setScriptId(savedId);
        setStep("characters");
      } else {
        setError(
          "Unsupported file type. Please upload a .txt or .pdf file."
        );
      }
    } catch (err) {
      setError(
        `Failed to parse script: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleCharacterSelect = (characterName: string) => {
    setMyCharacter(characterName);

    // Auto-assign voices to all other characters
    const otherCharacters = script!.characters.filter(
      (c) => c.name !== characterName
    );
    const assignments = otherCharacters.map((char, i) =>
      getDefaultVoiceAssignment(char, i)
    );
    setVoiceAssignments(assignments);
    setStep("voices");
  };

  const updateVoiceAssignment = (
    characterName: string,
    updates: Partial<VoiceAssignment>
  ) => {
    setVoiceAssignments((prev) =>
      prev.map((va) =>
        va.characterName === characterName ? { ...va, ...updates } : va
      )
    );
  };

  const startRehearsal = () => {
    // Use DB script id when available so /rehearse/[id] is a deep-linkable URL
    const id = scriptId ?? `session-${Date.now()}`;
    const session = {
      id,
      script,
      myCharacter,
      voiceAssignments,
      currentLineIndex: 0,
      isPlaying: false,
    };
    sessionStorage.setItem("rehearsal-session", JSON.stringify(session));

    // Persist character + voice config so subsequent rehearsals skip the picker
    if (scriptId && authStatus === "authenticated") {
      fetch(`/api/scripts/${scriptId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastCharacter: myCharacter,
          voiceAssignments: voiceAssignments.map((va) => ({
            characterName: va.characterName,
            voiceConfig: va,
          })),
        }),
      }).catch(() => {});
    }

    router.push(`/rehearse/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {(["upload", "characters", "voices"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-medium transition-colors ${
                step === s
                  ? "bg-accent text-white"
                  : i < ["upload", "characters", "voices"].indexOf(step)
                    ? "bg-success text-white"
                    : "bg-surface-light text-muted"
              }`}
            >
              {i < ["upload", "characters", "voices"].indexOf(step) ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-base hidden sm:inline ${step === s ? "text-foreground font-medium" : "text-muted"}`}
            >
              {s === "upload"
                ? "Upload"
                : s === "characters"
                  ? "Pick Your Part"
                  : "Assign Voices"}
            </span>
            {i < 2 && (
              <div className="w-12 h-px bg-border mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div>
          <h1 className="text-3xl font-bold text-center mb-2">
            Upload your script
          </h1>
          <p className="text-muted text-center mb-8">
            Drop in a PDF or plain text file of your script
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50 hover:bg-surface"
            }`}
            onClick={() =>
              document.getElementById("file-input")?.click()
            }
          >
            <input
              id="file-input"
              type="file"
              accept=".txt,.pdf,.text"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {loading ? (
                <svg className="w-8 h-8 text-accent-light animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </div>
            <p className="text-lg font-medium mb-2">
              {loading
                ? "Parsing your script..."
                : "Drop your script here or click to browse"}
            </p>
            <p className="text-base text-muted">
              Supports .txt and .pdf files
            </p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-base">
              {error}
            </div>
          )}

          {/* Sample Script Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                const sampleScript = `Romeo and Juliet - Act 2, Scene 2

ACT II

SCENE 2

[A garden. JULIET appears above at a window.]

ROMEO: But, soft! What light through yonder window breaks? It is the east, and Juliet is the sun. Arise, fair sun, and kill the envious moon, who is already sick and pale with grief.

JULIET: O Romeo, Romeo! Wherefore art thou Romeo? Deny thy father and refuse thy name; or, if thou wilt not, be but sworn my love, and I'll no longer be a Capulet.

ROMEO: Shall I hear more, or shall I speak at this?

JULIET: 'Tis but thy name that is my enemy; thou art thyself, though not a Montague. What's Montague? It is nor hand, nor foot, nor arm, nor face, nor any other part belonging to a man. O, be some other name!

ROMEO: I take thee at thy word. Call me but love, and I'll be new baptized; henceforth I never will be Romeo.

JULIET: What man art thou that thus bescreen'd in night so stumblest on my counsel?

ROMEO: By a name I know not how to tell thee who I am. My name, dear saint, is hateful to myself, because it is an enemy to thee.

JULIET: My ears have not yet drunk a hundred words of that tongue's utterance, yet I know the sound. Art thou not Romeo, and a Montague?

ROMEO: Neither, fair maid, if either thee dislike.

[NURSE calls from within.]

NURSE: Madam!

JULIET: A thousand times good night!

ROMEO: A thousand times the worse, to want thy light. Love goes toward love, as schoolboys from their books; but love from love, toward school with heavy looks.`;
                const parsed = parseScript(sampleScript, "Romeo and Juliet.txt");
                setScript(parsed);
                persistScript(parsed, sampleScript, "Romeo and Juliet.txt").then((id) => {
                  if (id) setScriptId(id);
                });
                setStep("characters");
              }}
              className="text-base text-accent-light hover:text-accent transition-colors underline underline-offset-4"
            >
              Try with a sample script (Romeo & Juliet)
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Character Selection */}
      {step === "characters" && script && (
        <div>
          <h1 className="text-3xl font-bold text-center mb-2">
            Pick your part
          </h1>
          <p className="text-muted text-center mb-2">
            Select the character you want to rehearse as
          </p>
          <div className="flex items-center justify-center gap-4 mb-8 text-base text-muted">
            <span className="bg-surface-light px-3 py-1 rounded-full">
              {script.title}
            </span>
            <span className="bg-surface-light px-3 py-1 rounded-full">
              {script.characters.length} characters
            </span>
            <span className="bg-surface-light px-3 py-1 rounded-full">
              {script.lines.filter((l) => l.type === "dialogue").length} lines
            </span>
            <span className="bg-surface-light px-3 py-1 rounded-full">
              {script.actCount} act{script.actCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {script.characters.map((char) => (
              <button
                key={char.name}
                onClick={() => handleCharacterSelect(char.name)}
                className={`bg-surface border border-border rounded-xl p-5 text-left hover:border-accent/50 transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg group-hover:text-accent-light transition-colors">
                    {char.name}
                  </h3>
                  <span className="text-sm bg-surface-light px-2 py-1 rounded-full text-muted">
                    {char.lineCount} line{char.lineCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-base text-muted">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    {char.suggestedGender}
                  </span>
                  <span className="flex items-center gap-1">
                    {char.suggestedAge}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setStep("upload");
                setScript(null);
              }}
              className="text-base text-muted hover:text-foreground transition-colors"
            >
              Upload a different script
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Voice Assignment */}
      {step === "voices" && script && (
        <div>
          <h1 className="text-3xl font-bold text-center mb-2">
            Assign voices
          </h1>
          <p className="text-muted text-center mb-8">
            Customize the AI voice for each character. You are playing{" "}
            <span className="text-success font-medium">{myCharacter}</span>.
          </p>

          <div className="space-y-4">
            {voiceAssignments.map((va) => (
              <div
                key={va.characterName}
                className="bg-surface border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{va.characterName}</h3>
                  <span className="text-base text-accent-light">
                    {va.voiceName}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="text-sm text-muted block mb-1.5">
                      Gender
                    </label>
                    <select
                      value={va.gender}
                      onChange={(e) => {
                        const gender = e.target.value;
                        const voices = getVoicesForCategory(gender, va.age);
                        updateVoiceAssignment(va.characterName, {
                          gender: gender as VoiceAssignment["gender"],
                          voiceId: voices[0]?.id || va.voiceId,
                          voiceName: voices[0]?.name || va.voiceName,
                        });
                      }}
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:border-accent"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-sm text-muted block mb-1.5">
                      Age
                    </label>
                    <select
                      value={va.age}
                      onChange={(e) => {
                        const age = e.target.value;
                        const voices = getVoicesForCategory(va.gender, age);
                        updateVoiceAssignment(va.characterName, {
                          age: age as VoiceAssignment["age"],
                          voiceId: voices[0]?.id || va.voiceId,
                          voiceName: voices[0]?.name || va.voiceName,
                        });
                      }}
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:border-accent"
                    >
                      {AGE_OPTIONS.map((age) => (
                        <option key={age} value={age}>
                          {age
                            .replace("-", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Accent */}
                  <div>
                    <label className="text-sm text-muted block mb-1.5">
                      Accent
                    </label>
                    <select
                      value={va.accent}
                      onChange={(e) =>
                        updateVoiceAssignment(va.characterName, {
                          accent: e.target.value,
                        })
                      }
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:border-accent"
                    >
                      {ACCENT_OPTIONS.map((accent) => (
                        <option key={accent} value={accent}>
                          {accent}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Speed & Pitch Sliders */}
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm text-muted block mb-1.5">
                      Speed: {va.rate.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={va.rate}
                      onChange={(e) =>
                        updateVoiceAssignment(va.characterName, {
                          rate: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted block mb-1.5">
                      Pitch: {va.pitch.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={va.pitch}
                      onChange={(e) =>
                        updateVoiceAssignment(va.characterName, {
                          pitch: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-accent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep("characters")}
              className="text-base text-muted hover:text-foreground transition-colors"
            >
              Change character
            </button>
            <button
              onClick={startRehearsal}
              className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-accent/25"
            >
              Start Rehearsal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
