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
    id: "manifest",
    name: "Manifest Financial",
    description: "Payment processing for subscriptions and payouts",
    color: "bg-emerald-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    ),
    fields: [
      { key: "manifest_api_url", label: "API URL", type: "text", placeholder: "https://api.manifestfinancial.com/v1" },
      { key: "manifest_secret_key", label: "Secret Key", type: "password", placeholder: "mf_sk_..." },
    ],
    testId: "manifest",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
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
      { key: "elevenlabs_api_key", label: "API Key", type: "password", placeholder: "xi_..." },
    ],
    testId: "elevenlabs",
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
