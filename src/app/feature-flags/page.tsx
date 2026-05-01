"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  min_tier: "free" | "pro" | "studio";
}

const MVP_KEYS = new Set([
  "script_analysis",
  "line_memory",
  "bookmarks",
  "teleprompter",
]);

const MVP_DESCRIPTIONS: Record<string, string> = {
  script_analysis: "Upload a script and parse it into scenes and lines.",
  line_memory: "Memorize lines with hide/reveal practice.",
  bookmarks: "Mark and jump to specific moments in a script.",
  teleprompter: "Scrolling teleprompter view for rehearsal.",
};

const formatFlagName = (key: string) =>
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export default function FeatureFlagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<"mvp" | "all" | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || (session?.user as any)?.role !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/feature-flags");
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setFlags(
            data.map((f: any) => ({
              key: f.key,
              enabled: f.enabled === 1 || f.enabled === true,
              min_tier: f.min_tier || "free",
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setFlagEnabled = async (key: string, enabled: boolean) => {
    const res = await fetch("/api/admin/feature-flags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
    if (!res.ok) throw new Error("Update failed");
  };

  const toggleFlag = async (key: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setBusyKey(key);
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: newEnabled } : f)));
    try {
      await setFlagEnabled(key, newEnabled);
      showToast(`${formatFlagName(key)} ${newEnabled ? "enabled" : "disabled"}`, "success");
    } catch {
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: currentEnabled } : f)));
      showToast("Failed to update", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const enableMvpOnly = async () => {
    setBulkBusy("mvp");
    const targets = flags.map((f) => ({
      key: f.key,
      enabled: MVP_KEYS.has(f.key),
    }));
    let failed = 0;
    for (const t of targets) {
      try {
        await setFlagEnabled(t.key, t.enabled);
      } catch {
        failed++;
      }
    }
    setFlags((prev) => prev.map((f) => ({ ...f, enabled: MVP_KEYS.has(f.key) })));
    if (failed === 0) {
      showToast("MVP-only mode applied — non-MVP features disabled", "success");
    } else {
      showToast(`Applied with ${failed} failures`, "error");
    }
    setBulkBusy(null);
  };

  const enableAll = async () => {
    setBulkBusy("all");
    let failed = 0;
    for (const f of flags) {
      if (f.enabled) continue;
      try {
        await setFlagEnabled(f.key, true);
      } catch {
        failed++;
      }
    }
    setFlags((prev) => prev.map((f) => ({ ...f, enabled: true })));
    if (failed === 0) {
      showToast("All features enabled", "success");
    } else {
      showToast(`Applied with ${failed} failures`, "error");
    }
    setBulkBusy(null);
  };

  const { mvpFlags, beyondFlags } = useMemo(() => {
    const mvp: FeatureFlag[] = [];
    const beyond: FeatureFlag[] = [];
    for (const f of flags) {
      if (MVP_KEYS.has(f.key)) mvp.push(f);
      else beyond.push(f);
    }
    mvp.sort((a, b) => a.key.localeCompare(b.key));
    beyond.sort((a, b) => a.key.localeCompare(b.key));
    return { mvpFlags: mvp, beyondFlags: beyond };
  }, [flags]);

  const beyondEnabledCount = beyondFlags.filter((f) => f.enabled).length;
  const isMvpOnly = beyondEnabledCount === 0 && mvpFlags.every((f) => f.enabled);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (status === "unauthenticated" || (session?.user as any)?.role !== "admin") {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <p className="text-muted mt-2">
          Disable everything except the core MVP, or toggle individual features one at a time.
        </p>
      </div>

      {/* MVP Mode panel */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">MVP Mode</h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isMvpOnly ? "bg-success/15 text-success" : "bg-surface-light text-muted"
                }`}
              >
                {isMvpOnly ? "Active" : "Off"}
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              Keeps only the {MVP_KEYS.size} core MVP features on. {beyondEnabledCount} non-MVP
              feature{beyondEnabledCount === 1 ? "" : "s"} currently enabled.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={enableMvpOnly}
              disabled={bulkBusy !== null || busyKey !== null}
              className="px-4 py-2 bg-warning/15 text-warning border border-warning/30 rounded-lg text-sm font-medium hover:bg-warning/25 transition-colors disabled:opacity-50"
            >
              {bulkBusy === "mvp" ? "Applying..." : "Disable Non-MVP"}
            </button>
            <button
              onClick={enableAll}
              disabled={bulkBusy !== null || busyKey !== null}
              className="px-4 py-2 bg-surface-light text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50"
            >
              {bulkBusy === "all" ? "Enabling..." : "Enable All"}
            </button>
          </div>
        </div>
      </div>

      {/* MVP Core */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden mb-8">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Core MVP</h2>
            <p className="text-sm text-muted mt-0.5">
              The minimum features needed for a working actor rehearsal app.
            </p>
          </div>
          <span className="text-xs font-medium bg-success/15 text-success px-2 py-1 rounded-full">
            Keep on
          </span>
        </div>
        <div className="divide-y divide-border">
          {mvpFlags.map((flag) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              description={MVP_DESCRIPTIONS[flag.key]}
              busy={busyKey === flag.key || bulkBusy !== null}
              onToggle={() => toggleFlag(flag.key, flag.enabled)}
              core
            />
          ))}
          {mvpFlags.length === 0 && (
            <div className="p-5 text-sm text-muted">
              No MVP flags found in the database. Run db:seed to create them.
            </div>
          )}
        </div>
      </section>

      {/* Beyond MVP */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Beyond MVP</h2>
            <p className="text-sm text-muted mt-0.5">
              Everything else. Disable individually or all at once with the button above.
            </p>
          </div>
          <span className="text-xs font-medium bg-surface-light text-muted px-2 py-1 rounded-full">
            {beyondEnabledCount}/{beyondFlags.length} on
          </span>
        </div>
        <div className="divide-y divide-border">
          {beyondFlags.map((flag) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              busy={busyKey === flag.key || bulkBusy !== null}
              onToggle={() => toggleFlag(flag.key, flag.enabled)}
            />
          ))}
        </div>
      </section>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 z-50 ${
            toast.type === "success" ? "bg-surface border-success/30" : "bg-surface border-danger/30"
          }`}
        >
          <svg
            className={`w-5 h-5 shrink-0 ${
              toast.type === "success" ? "text-success" : "text-danger"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            {toast.type === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            )}
          </svg>
          <span className="text-base">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function FlagRow({
  flag,
  description,
  busy,
  onToggle,
  core = false,
}: {
  flag: FeatureFlag;
  description?: string;
  busy: boolean;
  onToggle: () => void;
  core?: boolean;
}) {
  const label = flag.key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return (
    <div className="flex items-center justify-between p-4 gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm ${!flag.enabled ? "text-muted line-through" : ""}`}>
            {label}
          </span>
          {core && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-success bg-success/10 px-1.5 py-0.5 rounded">
              MVP
            </span>
          )}
        </div>
        <div className="text-xs text-muted font-mono truncate">{flag.key}</div>
        {description && <div className="text-xs text-muted mt-1">{description}</div>}
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
          flag.enabled ? "bg-accent" : "bg-surface-light"
        }`}
        aria-label={`Toggle ${label}`}
        aria-pressed={flag.enabled}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            flag.enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
