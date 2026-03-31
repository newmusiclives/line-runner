"use client";

import { useState } from "react";

interface Segment {
  id: string;
  genre: string;
  scriptPrompt: string;
  recorded: boolean;
  duration: string;
}

interface MusicBed {
  id: string;
  name: string;
  style: string;
  bpm: number;
  duration: string;
}

const INITIAL_SEGMENTS: Segment[] = [
  {
    id: "commercial",
    genre: "Commercial",
    scriptPrompt: "Introducing the all-new Horizon EV. Zero emissions. Zero compromises. Test drive yours this weekend at any Horizon dealership.",
    recorded: false,
    duration: "0:15",
  },
  {
    id: "corporate",
    genre: "Corporate",
    scriptPrompt: "At Meridian Solutions, we believe innovation starts with understanding. For over two decades, we have partnered with Fortune 500 companies to transform ideas into impact.",
    recorded: false,
    duration: "0:20",
  },
  {
    id: "character",
    genre: "Character",
    scriptPrompt: "Well well well, look who finally showed up. You know, where I come from, we have a saying: never trust a wizard who smiles before breakfast.",
    recorded: false,
    duration: "0:12",
  },
  {
    id: "promo",
    genre: "Promo",
    scriptPrompt: "This Sunday on Discovery Channel: they risked everything to find what lies beneath. Expedition Unknown, the season premiere, Sunday at nine.",
    recorded: false,
    duration: "0:15",
  },
  {
    id: "audiobook",
    genre: "Audiobook",
    scriptPrompt: "The rain had not stopped for three days. Margaret stood at the window, watching the garden slowly disappear beneath rising water, wondering if anyone would come.",
    recorded: false,
    duration: "0:18",
  },
  {
    id: "elearning",
    genre: "E-learning",
    scriptPrompt: "In this module, you will learn the fundamentals of workplace safety. Please note that all employees are required to complete this training by end of quarter.",
    recorded: false,
    duration: "0:15",
  },
  {
    id: "medical",
    genre: "Medical",
    scriptPrompt: "Ask your doctor if Relvantix is right for you. In clinical trials, patients experienced a 40 percent reduction in symptoms. Side effects may include headache and dizziness.",
    recorded: false,
    duration: "0:15",
  },
];

const MUSIC_BEDS: MusicBed[] = [
  { id: "m1", name: "Corporate Pulse", style: "Upbeat Corporate", bpm: 120, duration: "2:30" },
  { id: "m2", name: "Warm Acoustic", style: "Gentle Acoustic Guitar", bpm: 96, duration: "3:00" },
  { id: "m3", name: "Cinematic Rise", style: "Epic Orchestral Build", bpm: 85, duration: "2:15" },
  { id: "m4", name: "Urban Energy", style: "Modern Hip-Hop Beat", bpm: 140, duration: "2:45" },
  { id: "m5", name: "Clean Tech", style: "Minimal Electronic", bpm: 110, duration: "3:15" },
  { id: "m6", name: "Soft Piano", style: "Emotional Piano Solo", bpm: 72, duration: "2:00" },
];

export default function DemoReelPage() {
  const [segments, setSegments] = useState<Segment[]>(INITIAL_SEGMENTS);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<string>("m1");
  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [exportFormat, setExportFormat] = useState<"mp3" | "wav" | null>(null);

  const recordedCount = segments.filter((s) => s.recorded).length;
  const totalCount = segments.length;
  const progressPercent = (recordedCount / totalCount) * 100;

  const handleRecord = (segmentId: string) => {
    if (isRecording) {
      setIsRecording(false);
      setSegments((prev) =>
        prev.map((s) => (s.id === segmentId ? { ...s, recorded: true } : s))
      );
    } else {
      setSelectedSegment(segmentId);
      setIsRecording(true);
    }
  };

  const handleClearRecording = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, recorded: false } : s))
    );
  };

  const handleAssemble = () => {
    if (recordedCount < 3) {
      alert("Record at least 3 segments before assembling your reel.");
      return;
    }
    setShowPreview(true);
  };

  const handleExport = (format: "mp3" | "wav") => {
    setExportFormat(format);
    setTimeout(() => setExportFormat(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Demo Reel Producer</h1>
      <p className="text-muted mb-8">Build a broadcast-standard VO demo reel with 7 genre segments.</p>

      {/* Progress Tracker */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Progress</h2>
          <span className="text-sm text-muted">{recordedCount} of {totalCount} segments recorded</span>
        </div>
        <div className="h-3 bg-surface-light rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-accent transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex gap-2">
          {segments.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-2 rounded-full ${s.recorded ? "bg-success" : "bg-surface-light"}`}
              title={s.genre}
            />
          ))}
        </div>
      </div>

      {/* Segments Grid */}
      <div className="space-y-4 mb-8">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`bg-surface border rounded-xl p-5 transition-colors ${
              selectedSegment === segment.id ? "border-accent" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-3 h-3 rounded-full ${segment.recorded ? "bg-success" : "bg-surface-light"}`} />
                  <h3 className="font-semibold">{segment.genre}</h3>
                  <span className="text-xs text-muted">{segment.duration}</span>
                  {segment.recorded && (
                    <span className="text-xs bg-success/15 text-success border border-success/30 px-2 py-0.5 rounded">
                      Recorded
                    </span>
                  )}
                </div>
                <div className="bg-surface-light rounded-lg p-3 text-sm leading-relaxed mb-3">
                  &ldquo;{segment.scriptPrompt}&rdquo;
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {segment.recorded ? (
                  <>
                    <button className="bg-surface-light hover:bg-border text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                      Play
                    </button>
                    <button
                      onClick={() => handleClearRecording(segment.id)}
                      className="bg-danger/15 text-danger hover:bg-danger/25 text-sm px-3 py-2 rounded-lg transition-colors"
                    >
                      Redo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRecord(segment.id)}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors font-medium ${
                      isRecording && selectedSegment === segment.id
                        ? "bg-danger text-white animate-pulse"
                        : "bg-accent hover:bg-accent-dark text-white"
                    }`}
                  >
                    {isRecording && selectedSegment === segment.id ? "Stop" : "Record"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Music Bed Selector */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Music Bed</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MUSIC_BEDS.map((bed) => (
            <button
              key={bed.id}
              onClick={() => setSelectedMusic(bed.id)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                selectedMusic === bed.id
                  ? "bg-accent/10 border-accent/30 text-foreground"
                  : "bg-surface-light border-border hover:border-accent/20"
              }`}
            >
              <div className="font-medium text-sm mb-1">{bed.name}</div>
              <div className="text-xs text-muted">{bed.style}</div>
              <div className="flex gap-3 text-xs text-muted mt-2">
                <span>{bed.bpm} BPM</span>
                <span>{bed.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Assemble & Export */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleAssemble}
          className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg"
        >
          Assemble Reel
        </button>
        <button
          onClick={() => handleExport("mp3")}
          className="bg-surface border border-border hover:border-accent/30 text-foreground font-medium px-6 py-3.5 rounded-xl transition-colors"
        >
          {exportFormat === "mp3" ? "Exporting..." : "Export MP3"}
        </button>
        <button
          onClick={() => handleExport("wav")}
          className="bg-surface border border-border hover:border-accent/30 text-foreground font-medium px-6 py-3.5 rounded-xl transition-colors"
        >
          {exportFormat === "wav" ? "Exporting..." : "Export WAV"}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Reel Preview</h2>
            <div className="space-y-3 mb-6">
              {segments.filter((s) => s.recorded).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 bg-surface-light rounded-lg p-3">
                  <span className="text-sm font-mono text-muted w-6">{i + 1}.</span>
                  <span className="text-sm font-medium">{s.genre}</span>
                  <span className="text-xs text-muted ml-auto">{s.duration}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-lg p-3">
                <span className="text-sm">Music Bed:</span>
                <span className="text-sm font-medium text-accent-light">
                  {MUSIC_BEDS.find((m) => m.id === selectedMusic)?.name}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-surface-light hover:bg-border text-foreground font-medium py-3 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { handleExport("mp3"); setShowPreview(false); }}
                className="flex-1 bg-accent hover:bg-accent-dark text-white font-medium py-3 rounded-xl transition-colors"
              >
                Export Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
