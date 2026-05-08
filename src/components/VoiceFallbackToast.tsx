"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FallbackEventDetail {
  code?: string;
  message?: string;
}

export default function VoiceFallbackToast() {
  const [toast, setToast] = useState<FallbackEventDetail | null>(null);

  useEffect(() => {
    function onFallback(e: Event) {
      const detail = (e as CustomEvent<FallbackEventDetail>).detail || {};
      setToast(detail);
    }
    window.addEventListener("voice:fallback", onFallback);
    return () => window.removeEventListener("voice:fallback", onFallback);
  }, []);

  // Auto-dismiss non-credit warnings; OUT_OF_CREDITS sticks until dismissed.
  useEffect(() => {
    if (!toast) return;
    if (toast.code === "OUT_OF_CREDITS") return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  const isOutOfCredits = toast.code === "OUT_OF_CREDITS";

  return (
    <div
      className="fixed bottom-6 right-6 max-w-sm z-50 bg-surface border border-amber-500/30 rounded-xl shadow-lg shadow-amber-500/10 px-4 py-3 flex items-start gap-3 animate-in slide-in-from-bottom-4"
      role="status"
      aria-live="polite"
    >
      <svg
        className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.732 0 2.814-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <div className="flex-1 min-w-0">
        {isOutOfCredits ? (
          <>
            <div className="text-sm font-semibold text-foreground">Out of voice minutes</div>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              You&apos;ve used your monthly Gemini voice credits. Switched to browser TTS for now.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/pricing"
                className="inline-block px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-md hover:bg-accent-dark transition-colors"
                onClick={() => setToast(null)}
              >
                Upgrade
              </Link>
              <Link
                href="/dashboard/credits"
                className="inline-block px-3 py-1.5 bg-surface-light text-foreground text-xs font-medium rounded-md hover:bg-border transition-colors"
                onClick={() => setToast(null)}
              >
                Buy credit block
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-foreground">Premium voice unavailable</div>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Falling back to your browser&apos;s built-in voice for this line.
            </p>
          </>
        )}
      </div>
      <button
        onClick={() => setToast(null)}
        className="text-muted hover:text-foreground transition-colors -m-1 p-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
