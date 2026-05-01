"use client";

import { useState, useEffect } from "react";

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: { key: string; label: string; type: "text" | "password"; placeholder: string }[];
  testId: string;
}

const services: ServiceConfig[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing — subscriptions, checkout, and webhooks. Recommended: set these in Netlify environment variables; this panel is a fallback.",
    color: "bg-indigo-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    ),
    fields: [
      { key: "stripe_secret_key", label: "Secret Key", type: "password", placeholder: "sk_test_... or sk_live_..." },
      { key: "stripe_webhook_secret", label: "Webhook Signing Secret", type: "password", placeholder: "whsec_..." },
      { key: "stripe_price_pro", label: "Pro Price ID ($20/mo)", type: "text", placeholder: "price_..." },
      { key: "stripe_price_studio", label: "Studio Price ID ($70/mo)", type: "text", placeholder: "price_..." },
    ],
    testId: "stripe",
  },
  {
    id: "gemini",
    name: "Gemini Voices (Google)",
    description: "AI voice synthesis for premium scene partner voices",
    color: "bg-violet-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
      />
    ),
    fields: [
      { key: "gemini_api_key", label: "API Key", type: "password", placeholder: "AIza..." },
    ],
    testId: "gemini",
  },
  {
    id: "gohighlevel",
    name: "GoHighLevel",
    description: "CRM, email, SMS, and communication automation",
    color: "bg-orange-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    ),
    fields: [
      { key: "gohighlevel_api_key", label: "API Key", type: "password", placeholder: "eyJ..." },
      { key: "gohighlevel_location_id", label: "Location ID", type: "text", placeholder: "loc_..." },
    ],
    testId: "gohighlevel",
  },
  {
    id: "google",
    name: "Google OAuth",
    description: "Allow users to sign in with their Google account",
    color: "bg-blue-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
      />
    ),
    fields: [
      { key: "google_client_id", label: "Client ID", type: "text", placeholder: "xxxx.apps.googleusercontent.com" },
      { key: "google_client_secret", label: "Client Secret", type: "password", placeholder: "GOCSPX-..." },
    ],
    testId: "google",
  },
  {
    id: "claude",
    name: "Claude AI (Anthropic)",
    description: "AI-powered script analysis, performance coaching, and emotion detection",
    color: "bg-amber-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
      />
    ),
    fields: [
      { key: "claude_api_key", label: "API Key", type: "password", placeholder: "sk-ant-..." },
    ],
    testId: "claude",
  },
  {
    id: "smtp",
    name: "Email (SMTP)",
    description: "Send password resets, welcome emails, and notifications",
    color: "bg-cyan-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    ),
    fields: [
      { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "Port", type: "text", placeholder: "587" },
      { key: "smtp_user", label: "Username", type: "text", placeholder: "you@gmail.com" },
      { key: "smtp_pass", label: "Password", type: "password", placeholder: "app-password" },
      { key: "smtp_from_email", label: "From Email", type: "text", placeholder: "noreply@linerunner.app" },
      { key: "smtp_from_name", label: "From Name", type: "text", placeholder: "Line Runner" },
    ],
    testId: "smtp",
  },
  {
    id: "storage",
    name: "Cloud Storage (S3)",
    description: "Store audio files in S3-compatible storage (R2, MinIO, AWS S3)",
    color: "bg-teal-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
      />
    ),
    fields: [
      { key: "storage_endpoint", label: "Endpoint URL", type: "text", placeholder: "https://your-account.r2.cloudflarestorage.com" },
      { key: "storage_bucket", label: "Bucket Name", type: "text", placeholder: "line-runner-audio" },
      { key: "storage_access_key", label: "Access Key", type: "password", placeholder: "AKIA..." },
      { key: "storage_secret_key", label: "Secret Key", type: "password", placeholder: "wJal..." },
      { key: "storage_public_url", label: "Public URL (optional)", type: "text", placeholder: "https://cdn.yoursite.com" },
    ],
    testId: "storage",
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Error monitoring and performance tracking",
    color: "bg-pink-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.253M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0112 3.75a3.75 3.75 0 013.317 1.25m-6.634 0a3.75 3.75 0 00-.581-2.749"
      />
    ),
    fields: [
      { key: "sentry_dsn", label: "DSN", type: "text", placeholder: "https://xxxxx@sentry.io/xxxxx" },
    ],
    testId: "sentry",
  },
];

interface FieldState {
  [key: string]: string;
}

interface TestResult {
  ok: boolean;
  message?: string;
  error?: string;
}

export default function AdminIntegrationsPage() {
  const [values, setValues] = useState<FieldState>({});
  const [savedValues, setSavedValues] = useState<FieldState>({});
  const [hasValue, setHasValue] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/integrations");
      if (res.ok) {
        const data = await res.json();
        const vals: FieldState = {};
        const has: Record<string, boolean> = {};
        for (const item of data) {
          vals[item.key] = item.value || "";
          has[item.key] = item.hasValue;
        }
        setSavedValues(vals);
        setValues(vals);
        setHasValue(has);
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  async function saveField(key: string, value: string) {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.action === "deleted" ? "Key removed" : "Saved", "success");
        setSavedValues((prev) => ({ ...prev, [key]: value }));
        setHasValue((prev) => ({ ...prev, [key]: !!value }));
      } else {
        showToast("Failed to save", "error");
      }
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(null);
    }
  }

  async function saveService(service: ServiceConfig) {
    for (const field of service.fields) {
      const val = values[field.key] || "";
      // Only save if changed from saved value
      if (val !== savedValues[field.key]) {
        await saveField(field.key, val);
      }
    }
  }

  async function testConnection(service: ServiceConfig) {
    setTesting(service.id);
    setTestResults((prev) => ({ ...prev, [service.id]: undefined as any }));
    try {
      const res = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: service.testId }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [service.id]: data }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [service.id]: { ok: false, error: "Request failed" },
      }));
    } finally {
      setTesting(null);
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function hasChanges(service: ServiceConfig): boolean {
    return service.fields.some((f) => (values[f.key] || "") !== (savedValues[f.key] || ""));
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted mt-1">
          Connect external services to enable payments, premium voices, and CRM.
        </p>
      </div>

      <div className="space-y-6">
        {services.map((service) => {
          const result = testResults[service.id];
          const isConnected = service.fields.every((f) => hasValue[f.key]);

          return (
            <div key={service.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center gap-4">
                <div className={`${service.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    {service.icon}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{service.name}</h2>
                    {isConnected ? (
                      <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">
                        Configured
                      </span>
                    ) : (
                      <span className="text-xs bg-surface-light text-muted px-2 py-0.5 rounded-full font-medium">
                        Not connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{service.description}</p>
                </div>
              </div>

              {/* Fields */}
              <div className="p-5 space-y-4">
                {service.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      value={values[field.key] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-muted/50 font-mono"
                    />
                    <div className="text-xs text-muted mt-1 font-mono">{field.key}</div>
                  </div>
                ))}

                {/* Test result */}
                {result && (
                  <div
                    className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
                      result.ok
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-danger/10 text-danger border border-danger/20"
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      {result.ok ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      )}
                    </svg>
                    {result.ok ? result.message : result.error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => saveService(service)}
                    disabled={saving !== null || !hasChanges(service)}
                    className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => testConnection(service)}
                    disabled={testing !== null}
                    className="px-5 py-2 bg-surface-light text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors disabled:opacity-40"
                  >
                    {testing === service.id ? "Testing..." : "Test Connection"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GoHighLevel usage guide */}
      <div className="mt-8 bg-surface border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">GoHighLevel Integration Guide</h3>
        <p className="text-sm text-muted mb-4">
          Once connected, GoHighLevel handles all communication and CRM for Line Runner:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            "Automated welcome emails on signup",
            "Subscription confirmation & receipts",
            "Payment failure notifications",
            "Re-engagement campaigns for inactive users",
            "SMS notifications for Scene Exchange invites",
            "Fan notifications for PASS content updates",
            "Contact management & tagging by plan tier",
            "Pipeline tracking for Studio subscribers",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-muted">
              <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Claude AI usage guide */}
      <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Claude AI Integration Guide</h3>
        <p className="text-sm text-muted mb-4">
          When connected, Claude AI powers intelligent features across Line Runner:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            "Deep script analysis — genre, tone, character arcs",
            "AI Performance Coach with per-line feedback",
            "Intelligent emotion detection beyond keywords",
            "Director's notes with character motivation insights",
            "Subtext suggestions for character intention",
            "Smart sound effect cue suggestions",
            "Pronunciation guidance for difficult words",
            "Memorisation difficulty assessment",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-muted">
              <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 ${
          toast.type === "success"
            ? "bg-surface border-success/30"
            : "bg-surface border-danger/30"
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
