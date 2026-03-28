"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface RecordPlaybackProps {
  isRecording: boolean;
  onToggleRecord: () => void;
}

export default function RecordPlayback({
  isRecording: externalIsRecording,
  onToggleRecord,
}: RecordPlaybackProps) {
  const [recordings, setRecordings] = useState<
    { url: string; duration: number; createdAt: Date }[]
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      recordings.forEach((r) => URL.revokeObjectURL(r.url));
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = Date.now() - startTimeRef.current;
        setRecordings((prev) => [
          ...prev,
          { url, duration, createdAt: new Date() },
        ]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - startTimeRef.current);
      }, 100);

      onToggleRecord();
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }, [onToggleRecord]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onToggleRecord();
    }
  }, [isRecording, onToggleRecord]);

  const playRecording = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(recordings[index].url);
    audioRef.current = audio;
    setPlayingIndex(index);

    audio.onended = () => {
      setPlayingIndex(null);
      audioRef.current = null;
    };
    audio.play();
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingIndex(null);
    }
  };

  const deleteRecording = (index: number) => {
    if (playingIndex === index) stopPlayback();
    const removed = recordings[index];
    URL.revokeObjectURL(removed.url);
    setRecordings((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDuration = (ms: number): string => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${mins}:${remainSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="text-sm text-muted uppercase tracking-wide font-medium mb-4">
        Record &amp; Playback
      </h3>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Record Controls */}
      <div className="flex items-center gap-4 mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-3 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 px-5 py-3 rounded-xl transition-colors"
          >
            <span className="w-4 h-4 bg-danger rounded-full" />
            <span className="font-medium text-base">Record</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-3 bg-danger text-white px-5 py-3 rounded-xl transition-colors"
          >
            <span
              className="w-4 h-4 bg-white rounded-full"
              style={{ animation: "rec-pulse 1s ease-in-out infinite" }}
            />
            <span className="font-medium text-base">Stop</span>
          </button>
        )}

        {isRecording && (
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-danger rounded-full animate-pulse" />
            <span className="text-lg font-mono text-danger font-medium tabular-nums">
              {formatDuration(recordingDuration)}
            </span>
          </div>
        )}

        {!isRecording && recordings.length === 0 && (
          <p className="text-muted text-sm">
            Record your voice to practice delivery
          </p>
        )}
      </div>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="space-y-2">
          {recordings.map((recording, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 bg-surface-light rounded-xl px-4 py-3 transition-colors ${
                playingIndex === index ? "border border-accent/40" : ""
              }`}
            >
              {/* Waveform placeholder */}
              <div className="flex-1 flex items-center gap-1 h-8">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-colors ${
                      playingIndex === index ? "bg-accent" : "bg-muted/30"
                    }`}
                    style={{
                      height: `${Math.max(4, Math.sin(i * 0.8) * 16 + Math.random() * 12 + 8)}px`,
                    }}
                  />
                ))}
              </div>

              <span className="text-sm text-muted font-mono tabular-nums shrink-0">
                {formatDuration(recording.duration)}
              </span>

              {/* Play / Stop */}
              {playingIndex === index ? (
                <button
                  onClick={stopPlayback}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-accent text-white shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 6h12v12H6z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => playRecording(index)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface hover:bg-border text-foreground shrink-0 transition-colors"
                >
                  <svg
                    className="w-4 h-4 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => deleteRecording(index)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-danger/20 text-muted hover:text-danger shrink-0 transition-colors"
                title="Delete recording"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes rec-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
