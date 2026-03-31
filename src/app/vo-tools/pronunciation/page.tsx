"use client";

import { useState } from "react";

interface SavedWord {
  id: string;
  word: string;
  ipa: string;
  notes: string;
}

const MOCK_PHARMA: SavedWord[] = [
  { id: "p1", word: "Omeprazole", ipa: "oʊˈmɛprəzoʊl", notes: "Acid reflux medication" },
  { id: "p2", word: "Atorvastatin", ipa: "əˌtɔːrvəˈstætɪn", notes: "Cholesterol lowering statin" },
  { id: "p3", word: "Lisinopril", ipa: "laɪˈsɪnəprɪl", notes: "ACE inhibitor for blood pressure" },
  { id: "p4", word: "Metformin", ipa: "mɛtˈfɔːrmɪn", notes: "Diabetes medication" },
  { id: "p5", word: "Esomeprazole", ipa: "ˌɛsoʊˈmɛprəzoʊl", notes: "Proton pump inhibitor" },
];

// Simple English-to-IPA approximation for common patterns
function approximateIPA(word: string): string {
  const lower = word.toLowerCase();
  const rules: [RegExp, string][] = [
    [/tion$/, "ʃən"],
    [/sion$/, "ʒən"],
    [/ous$/, "əs"],
    [/ble$/, "bəl"],
    [/ment$/, "mənt"],
    [/ness$/, "nəs"],
    [/ing$/, "ɪŋ"],
    [/ight$/, "aɪt"],
    [/ough$/, "oʊ"],
    [/ph/, "f"],
    [/th/, "θ"],
    [/sh/, "ʃ"],
    [/ch/, "tʃ"],
    [/ck/, "k"],
    [/ee/, "iː"],
    [/oo/, "uː"],
    [/ea/, "iː"],
    [/ou/, "aʊ"],
    [/ow/, "aʊ"],
    [/ai/, "eɪ"],
    [/ay/, "eɪ"],
    [/oi/, "ɔɪ"],
    [/oy/, "ɔɪ"],
  ];

  let result = lower;
  for (const [pattern, replacement] of rules) {
    result = result.replace(pattern, replacement);
  }

  // Simple vowel replacements for remaining characters
  result = result
    .replace(/a/g, "æ")
    .replace(/e/g, "ɛ")
    .replace(/i/g, "ɪ")
    .replace(/o/g, "ɒ")
    .replace(/u/g, "ʌ")
    .replace(/y/g, "i");

  return `/${result}/`;
}

export default function PronunciationPage() {
  const [inputWord, setInputWord] = useState("");
  const [lookupResult, setLookupResult] = useState<{ word: string; ipa: string } | null>(null);
  const [dictionary, setDictionary] = useState<SavedWord[]>(MOCK_PHARMA);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [notes, setNotes] = useState("");

  const handleLookup = () => {
    if (!inputWord.trim()) return;
    // Check dictionary first
    const existing = dictionary.find((w) => w.word.toLowerCase() === inputWord.trim().toLowerCase());
    if (existing) {
      setLookupResult({ word: existing.word, ipa: existing.ipa });
    } else {
      setLookupResult({ word: inputWord.trim(), ipa: approximateIPA(inputWord.trim()) });
    }
  };

  const handleSave = () => {
    if (!lookupResult) return;
    const exists = dictionary.find((w) => w.word.toLowerCase() === lookupResult.word.toLowerCase());
    if (exists) return;
    const newEntry: SavedWord = {
      id: `w-${Date.now()}`,
      word: lookupResult.word,
      ipa: lookupResult.ipa,
      notes: notes,
    };
    setDictionary((prev) => [newEntry, ...prev]);
    setNotes("");
  };

  const handleDelete = (id: string) => {
    setDictionary((prev) => prev.filter((w) => w.id !== id));
  };

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingComplete(true);
    } else {
      setIsRecording(true);
      setRecordingComplete(false);
    }
  };

  const filteredDictionary = dictionary.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Pronunciation Coach</h1>
      <p className="text-muted mb-8">IPA guide, phonetic breakdown, and listen-and-repeat for tricky words.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lookup Section */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Word Lookup</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="Type a word to look up..."
                className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleLookup}
                className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Look Up
              </button>
            </div>

            {lookupResult && (
              <div className="bg-surface-light rounded-xl p-5">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold mb-1">{lookupResult.word}</div>
                  <div className="text-xl text-accent-light font-mono">{lookupResult.ipa}</div>
                </div>

                {/* Syllable breakdown */}
                <div className="flex justify-center gap-1 mb-4">
                  {lookupResult.word.split(/(?=[A-Z])|(?<=[aeiou])(?=[^aeiou])/i).filter(Boolean).map((syl, i) => (
                    <span key={i} className="bg-accent/15 text-accent-light border border-accent/30 px-3 py-1 rounded-lg text-sm font-medium">
                      {syl}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add a note (optional)"
                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={handleSave}
                    className="bg-success/15 text-success hover:bg-success/25 font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-success/30"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Record & Compare */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Record & Compare</h2>
            <p className="text-sm text-muted mb-4">Record yourself saying the word, then compare with the IPA guide.</p>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleRecord}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? "bg-danger animate-pulse"
                    : "bg-accent hover:bg-accent-dark"
                } text-white`}
              >
                {isRecording ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-muted">
                {isRecording ? "Recording... tap to stop" : recordingComplete ? "Recording complete" : "Tap to record"}
              </span>

              {recordingComplete && (
                <div className="w-full bg-surface-light rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <button className="text-accent-light hover:text-accent transition-colors flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                      Play Back
                    </button>
                    <button onClick={() => { setRecordingComplete(false); }} className="text-muted hover:text-foreground transition-colors flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                      </svg>
                      Re-record
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dictionary Section */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Personal Dictionary</h2>
            <span className="text-sm text-muted">{dictionary.length} words</span>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved words..."
            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:border-accent"
          />

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredDictionary.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">
                {searchQuery ? "No matches found." : "No words saved yet. Look up a word and save it."}
              </div>
            ) : (
              filteredDictionary.map((entry) => (
                <div key={entry.id} className="bg-surface-light rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold">{entry.word}</span>
                      <span className="text-accent-light text-sm font-mono">{entry.ipa}</span>
                    </div>
                    {entry.notes && <p className="text-xs text-muted">{entry.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setInputWord(entry.word);
                        setLookupResult({ word: entry.word, ipa: entry.ipa });
                      }}
                      className="text-muted hover:text-accent-light transition-colors"
                      title="Practice"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
