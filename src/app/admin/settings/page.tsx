"use client";

import { useState, useEffect } from "react";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  min_tier: "free" | "pro" | "studio";
}

type Tier = "free" | "pro" | "studio";

const TIERS: { id: Tier; label: string; color: string; bg: string }[] = [
  { id: "free", label: "Free", color: "text-muted", bg: "bg-surface-light" },
  { id: "pro", label: "Pro", color: "text-accent-light", bg: "bg-accent/15" },
  { id: "studio", label: "Studio", color: "text-success", bg: "bg-success/15" },
];

// Categorize features for display
const FEATURE_CATEGORIES: { name: string; description: string; keys: string[] }[] = [
  {
    name: "Core Rehearsal",
    description: "Basic rehearsal features and script tools",
    keys: [
      "script_analysis",
      "line_memory",
      "bookmarks",
      "annotations",
      "teleprompter",
    ],
  },
  {
    name: "Rehearsal Modes",
    description: "Advanced rehearsal modes beyond standard",
    keys: [
      "cold_read",
      "subtext_mode",
      "wildcard_mode",
      "sleep_learning",
    ],
  },
  {
    name: "AI & Performance",
    description: "AI coaching, emotion detection, and analysis tools",
    keys: [
      "ai_coach",
      "emotion_detection",
      "director_notes",
      "emotional_arc",
      "objective_obstacle",
      "relationship_dynamics",
    ],
  },
  {
    name: "Recording & Production",
    description: "Self-tape, audio, and export tools",
    keys: [
      "self_tape",
      "export_audio",
      "sound_effects",
      "directors_cut",
      "vault",
      "ritual_mode",
    ],
  },
  {
    name: "VO Professional Suite",
    description: "Voice-over tools for working professionals",
    keys: [
      "audio_quality",
      "pronunciation",
      "breath_detector",
      "adr_mode",
      "copy_timing",
      "voice_consistency",
      "demo_reel",
      "client_delivery",
      "rate_calculator",
      "vo_curriculum",
    ],
  },
  {
    name: "Monetization & Social",
    description: "Income streams and collaboration features",
    keys: [
      "scene_exchange",
      "masterclass",
      "pass_memberships",
      "studio_dashboard",
      "voice_print",
      "multi_character",
      "performance_analytics",
    ],
  },
  {
    name: "Platform & Growth",
    description: "Referrals, audition tracking, mobile, and infrastructure",
    keys: [
      "referral_system",
      "audition_tracker",
      "credit_blocks",
      "voice_chat",
      "waveform_editor",
      "invoice_pdf",
      "cloud_storage",
      "i18n",
      "mobile_app",
      "error_tracking",
    ],
  },
];

const formatFlagName = (key: string) =>
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filterTier, setFilterTier] = useState<Tier | "all">("all");

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
              min_tier: f.min_tier || "free",
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFlag = async (key: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setSaving(key);
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
        showToast(`${formatFlagName(key)} ${newEnabled ? "enabled" : "disabled"}`, "success");
      } else {
        setFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, enabled: currentEnabled } : f))
        );
        showToast("Failed to update", "error");
      }
    } catch {
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled: currentEnabled } : f))
        );
      showToast("Failed to update", "error");
    } finally {
      setSaving(null);
    }
  };

  const changeTier = async (key: string, newTier: Tier) => {
    const oldTier = flags.find((f) => f.key === key)?.min_tier;
    setSaving(key);
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, min_tier: newTier } : f))
    );

    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, min_tier: newTier }),
      });
      if (res.ok) {
        showToast(`${formatFlagName(key)} moved to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}`, "success");
      } else {
        setFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, min_tier: oldTier || "free" } : f))
        );
        showToast("Failed to update", "error");
      }
    } catch {
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, min_tier: oldTier || "free" } : f))
      );
      showToast("Failed to update", "error");
    } finally {
      setSaving(null);
    }
  };

  const applyMVP = async () => {
    setSaving("mvp");
    // MVP: Free gets only core basics, Pro gets rehearsal + AI, Studio gets everything
    const mvpConfig: Record<string, Tier> = {
      // Free tier — bare minimum
      script_analysis: "free",
      line_memory: "free",
      bookmarks: "free",
      teleprompter: "free",
      // Pro tier — full rehearsal + AI
      annotations: "pro",
      cold_read: "pro",
      subtext_mode: "pro",
      wildcard_mode: "pro",
      sleep_learning: "pro",
      ai_coach: "pro",
      emotion_detection: "pro",
      director_notes: "pro",
      emotional_arc: "pro",
      objective_obstacle: "pro",
      relationship_dynamics: "pro",
      self_tape: "pro",
      export_audio: "pro",
      sound_effects: "pro",
      directors_cut: "pro",
      vault: "pro",
      ritual_mode: "pro",
      scene_exchange: "pro",
      multi_character: "pro",
      performance_analytics: "pro",
      // Studio tier — VO tools + monetization
      audio_quality: "studio",
      pronunciation: "studio",
      breath_detector: "studio",
      adr_mode: "studio",
      copy_timing: "studio",
      voice_consistency: "studio",
      demo_reel: "studio",
      client_delivery: "studio",
      rate_calculator: "studio",
      vo_curriculum: "studio",
      masterclass: "studio",
      pass_memberships: "studio",
      studio_dashboard: "studio",
      voice_print: "studio",
      // New features
      referral_system: "free",
      audition_tracker: "pro",
      credit_blocks: "pro",
      voice_chat: "pro",
      waveform_editor: "studio",
      invoice_pdf: "studio",
      cloud_storage: "studio",
      i18n: "free",
      mobile_app: "free",
      error_tracking: "free",
    };

    try {
      for (const [key, tier] of Object.entries(mvpConfig)) {
        await fetch("/api/admin/feature-flags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, min_tier: tier }),
        });
      }
      // Refresh
      const res = await fetch("/api/admin/feature-flags");
      if (res.ok) {
        const data = await res.json();
        setFlags(
          data.map((f: any) => ({
            key: f.key,
            enabled: f.enabled === 1 || f.enabled === true,
            min_tier: f.min_tier || "free",
          }))
        );
      }
      showToast("MVP tiers applied", "success");
    } catch {
      showToast("Failed to apply MVP", "error");
    } finally {
      setSaving(null);
    }
  };

  const flagMap = new Map(flags.map((f) => [f.key, f]));

  // Count features per tier
  const tierCounts = { free: 0, pro: 0, studio: 0 };
  flags.forEach((f) => { if (f.enabled) tierCounts[f.min_tier]++; });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted mt-1">Manage features and assign them to subscription tiers.</p>
        </div>
        <button
          onClick={applyMVP}
          disabled={saving !== null}
          className="px-4 py-2 bg-warning/15 text-warning border border-warning/30 rounded-lg text-sm font-medium hover:bg-warning/25 transition-colors disabled:opacity-50"
        >
          {saving === "mvp" ? "Applying..." : "Apply MVP Defaults"}
        </button>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {TIERS.map((tier) => (
          <div key={tier.id} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${tier.color}`}>{tierCounts[tier.id]}</div>
            <div className="text-sm text-muted">{tier.label} features</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted">Filter:</span>
        <div className="flex bg-surface border border-border rounded-lg p-0.5">
          {[{ id: "all" as const, label: "All" }, ...TIERS].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterTier(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterTier === t.id
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature categories */}
      <div className="space-y-6">
        {FEATURE_CATEGORIES.map((category) => {
          const categoryFlags = category.keys
            .map((k) => flagMap.get(k))
            .filter((f): f is FeatureFlag => !!f)
            .filter((f) => filterTier === "all" || f.min_tier === filterTier);

          if (categoryFlags.length === 0) return null;

          return (
            <div key={category.name} className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-semibold">{category.name}</h2>
                <p className="text-sm text-muted mt-0.5">{category.description}</p>
              </div>
              <div className="divide-y divide-border">
                {categoryFlags.map((flag) => {
                  const currentTier = TIERS.find((t) => t.id === flag.min_tier)!;
                  return (
                    <div
                      key={flag.key}
                      className="flex items-center justify-between p-4 gap-4"
                    >
                      {/* Feature name + toggle */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleFlag(flag.key, flag.enabled)}
                          disabled={saving === flag.key}
                          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                            flag.enabled ? "bg-accent" : "bg-surface-light"
                          }`}
                          aria-label={`Toggle ${formatFlagName(flag.key)}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              flag.enabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <div className="min-w-0">
                          <div className={`font-medium text-sm ${!flag.enabled ? "text-muted line-through" : ""}`}>
                            {formatFlagName(flag.key)}
                          </div>
                          <div className="text-xs text-muted font-mono truncate">{flag.key}</div>
                        </div>
                      </div>

                      {/* Tier selector */}
                      <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shrink-0">
                        {TIERS.map((tier) => (
                          <button
                            key={tier.id}
                            onClick={() => changeTier(flag.key, tier.id)}
                            disabled={saving === flag.key}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                              flag.min_tier === tier.id
                                ? `${tier.bg} ${tier.color}`
                                : "text-muted/40 hover:text-muted"
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-surface border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-3">How Tier Assignment Works</h3>
        <div className="space-y-2 text-sm text-muted">
          <p>Each feature has a <strong>minimum tier</strong>. Users on that tier or higher get access.</p>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-surface-light" />
              <span><strong>Free</strong> — available to all users</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent/40" />
              <span><strong>Pro</strong> — $20/mo subscribers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success/40" />
              <span><strong>Studio</strong> — $90/mo subscribers</span>
            </div>
          </div>
          <p className="mt-3">Use the <strong>toggle</strong> to fully disable a feature (hidden from everyone). Use the <strong>tier buttons</strong> to control which plan can access it. Click <strong>Apply MVP Defaults</strong> to set Free and Pro to minimal feature sets.</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 ${
          toast.type === "success" ? "bg-surface border-success/30" : "bg-surface border-danger/30"
        }`}>
          <svg
            className={`w-5 h-5 shrink-0 ${toast.type === "success" ? "text-success" : "text-danger"}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            {toast.type === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            )}
          </svg>
          <span className="text-base">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
