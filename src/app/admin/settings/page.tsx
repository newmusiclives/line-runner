"use client";

import { useState, useEffect } from "react";

interface FeatureFlag {
  key: string;
  enabled: boolean;
}

const formatFlagName = (key: string) =>
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlags() {
      try {
        const res = await fetch("/api/admin/feature-flags");
        if (res.ok) {
          const data = await res.json();
          setFlags(
            data.map((f: any) => ({
              key: f.key,
              enabled: f.enabled === 1 || f.enabled === true,
            }))
          );
        }
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchFlags();
  }, []);

  const toggleFlag = async (key: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setSavingKey(key);
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: newEnabled } : f))
    );

    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: newEnabled }),
      });
      if (res.ok) {
        setToast(`${formatFlagName(key)} ${newEnabled ? "enabled" : "disabled"}`);
        setTimeout(() => setToast(null), 3000);
      } else {
        // Revert on failure
        setFlags((prev) =>
          prev.map((f) =>
            f.key === key ? { ...f, enabled: currentEnabled } : f
          )
        );
      }
    } catch {
      setFlags((prev) =>
        prev.map((f) =>
          f.key === key ? { ...f, enabled: currentEnabled } : f
        )
      );
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg
          className="w-8 h-8 text-accent animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Feature Flags */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Feature Flags</h2>
          <p className="text-sm text-muted mt-1">
            Enable or disable features across the application.
          </p>
        </div>
        <div className="divide-y divide-border">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between p-5"
            >
              <div>
                <div className="font-medium">{formatFlagName(flag.key)}</div>
                <div className="text-sm text-muted font-mono">{flag.key}</div>
              </div>
              <button
                onClick={() => toggleFlag(flag.key, flag.enabled)}
                disabled={savingKey === flag.key}
                className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
                  flag.enabled ? "bg-accent" : "bg-surface-light"
                }`}
                aria-label={`Toggle ${formatFlagName(flag.key)}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    flag.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
          {flags.length === 0 && (
            <div className="p-8 text-center text-muted">
              No feature flags configured
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-surface border border-border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4">
          <svg
            className="w-5 h-5 text-success shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          <span className="text-base">{toast}</span>
        </div>
      )}
    </div>
  );
}
