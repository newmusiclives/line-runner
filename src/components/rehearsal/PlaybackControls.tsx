"use client";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  onPrevLine: () => void;
  onNextLine: () => void;
  onOpenTiming: () => void;
  onOpenRemote: () => void;
  currentLine: number;
  totalLines: number;
}

export default function PlaybackControls({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRestart,
  onPrevLine,
  onNextLine,
  onOpenTiming,
  onOpenRemote,
  currentLine,
  totalLines,
}: PlaybackControlsProps) {
  return (
    <div className="bg-surface border-b border-border px-3 sm:px-4 py-3 sm:py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors shrink-0"
            title="Restart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={onPrevLine}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors shrink-0"
            title="Previous line"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => {
              if (!isPlaying && !isPaused) onPlay();
              else if (isPlaying && !isPaused) onPause();
              else if (isPaused) onResume();
            }}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-accent hover:bg-accent-dark transition-colors shadow-lg shadow-accent/25 shrink-0"
            title={isPlaying && !isPaused ? "Pause" : "Play"}
          >
            {isPlaying && !isPaused ? (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNextLine}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors shrink-0"
            title="Next line"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Stop */}
          <button
            onClick={onStop}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-danger/20 hover:text-danger transition-colors shrink-0"
            title="Stop"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>

          {/* Timing */}
          <button
            onClick={onOpenTiming}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors shrink-0"
            title="Timing settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>

          {/* Remote Control */}
          <button
            onClick={onOpenRemote}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-surface-light hover:bg-border transition-colors shrink-0"
            title="Remote control"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </button>
        </div>

        {/* Pause indicator */}
        {isPaused && (
          <div className="flex items-center justify-center mt-2 gap-2 text-warning text-sm">
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            Paused - Line {currentLine + 1} of {totalLines}
          </div>
        )}
      </div>
    </div>
  );
}
