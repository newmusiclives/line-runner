"use client";

import { useEffect, useState } from "react";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";

const STATE_KEY = "lr-ghl-setup-state-v1";

interface VerifyResult {
  ok: boolean;
  message?: string;
  location?: { id?: string; name?: string };
}

interface MultiResult {
  ok: boolean;
  results: { name: string; ok: boolean; message: string; id?: string }[];
}

interface SnapshotResult {
  ok: boolean;
  templates: { name: string; id?: string }[];
  templatesError?: string | null;
  fields: { name?: string }[];
  fieldsError?: string | null;
  contacts: { id: string; email?: string; tags?: string[] }[];
  contactsTotal: number;
  contactsError?: string | null;
}

type ActionState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; data: unknown }
  | { kind: "error"; message: string };

export default function GhlSetupPage() {
  const [verify, setVerify] = useState<ActionState>({ kind: "idle" });
  const [templates, setTemplates] = useState<ActionState>({ kind: "idle" });
  const [fields, setFields] = useState<ActionState>({ kind: "idle" });
  const [snapshot, setSnapshot] = useState<ActionState>({ kind: "idle" });

  // Hydrate prior run results from localStorage so reloads don't reset progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, unknown>;
      if (saved.verify) setVerify({ kind: "ok", data: saved.verify });
      if (saved.templates) setTemplates({ kind: "ok", data: saved.templates });
      if (saved.fields) setFields({ kind: "ok", data: saved.fields });
      if (saved.snapshot) setSnapshot({ kind: "ok", data: saved.snapshot });
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const persist = (action: string, data: unknown) => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      current[action] = data;
      localStorage.setItem(STATE_KEY, JSON.stringify(current));
    } catch {
      // ignore quota / parse errors
    }
  };

  const clearPersisted = () => {
    try {
      localStorage.removeItem(STATE_KEY);
    } catch {
      // ignore
    }
    setVerify({ kind: "idle" });
    setTemplates({ kind: "idle" });
    setFields({ kind: "idle" });
    setSnapshot({ kind: "idle" });
  };

  const run = async (
    action: string,
    setter: (s: ActionState) => void
  ) => {
    setter({ kind: "running" });
    try {
      const res = await fetch("/api/admin/ghl-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setter({ kind: "error", message: data.error || `HTTP ${res.status}` });
        return;
      }
      if (data.ok === false && !data.results) {
        setter({ kind: "error", message: data.message || "Failed" });
        return;
      }
      setter({ kind: "ok", data });
      persist(action, data);
    } catch (err) {
      setter({
        kind: "error",
        message: err instanceof Error ? err.message : "Request failed",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">GHL Setup</h1>
          <p className="text-muted mt-1">
            One-click scaffolding for the GoHighLevel side of the integration. Uses the API key
            saved in <span className="text-foreground">Admin → Integrations → GoHighLevel</span>.
          </p>
        </div>
        <button
          onClick={clearPersisted}
          className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg hover:bg-surface-light transition-colors shrink-0"
          title="Forget previous run results stored in this browser"
        >
          Clear history
        </button>
      </div>

      <div className="space-y-6">
        {/* Verify */}
        <Step
          number={1}
          title="Verify connection"
          description="Confirms the saved API key + Location ID can talk to GoHighLevel."
          action="verify"
          state={verify}
          onRun={() => run("verify", setVerify)}
          renderOk={(data) => {
            const d = data as VerifyResult;
            return (
              <div className="text-sm">
                <span className="text-success font-medium">✓</span> {d.message}
              </div>
            );
          }}
        />

        {/* Templates */}
        <Step
          number={2}
          title="Create email templates"
          description="Creates Welcome, Subscriber, and Churn Winback HTML email templates inside your GHL location."
          action="templates"
          state={templates}
          onRun={() => run("templates", setTemplates)}
          renderOk={(data) => {
            const d = data as MultiResult;
            return (
              <ul className="space-y-1 text-sm">
                {d.results.map((r) => (
                  <li key={r.name} className="flex items-start gap-2">
                    <span className={r.ok ? "text-success" : "text-danger"}>
                      {r.ok ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="font-medium">{r.name}</span> — {r.message}
                    </span>
                  </li>
                ))}
              </ul>
            );
          }}
        />

        {/* Step 2b — Paste HTML into the empty templates */}
        <TemplateBodies />

        {/* Custom fields */}
        <Step
          number={3}
          title="Create custom fields on contact"
          description="Adds Subscription Status, Current Plan, Stripe Customer ID, and Scripts Uploaded as fields you can use in GHL workflows and segmentation."
          action="fields"
          state={fields}
          onRun={() => run("fields", setFields)}
          renderOk={(data) => {
            const d = data as MultiResult;
            return (
              <ul className="space-y-1 text-sm">
                {d.results.map((r) => (
                  <li key={r.name} className="flex items-start gap-2">
                    <span className={r.ok ? "text-success" : "text-danger"}>
                      {r.ok ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="font-medium">{r.name}</span> — {r.message}
                    </span>
                  </li>
                ))}
              </ul>
            );
          }}
        />

        {/* Snapshot */}
        <Step
          number={4}
          title="Snapshot what's there"
          description="Reads back the templates, custom fields, and most recent contacts in GHL so you can confirm everything landed."
          action="snapshot"
          state={snapshot}
          onRun={() => run("snapshot", setSnapshot)}
          renderOk={(data) => {
            const d = data as SnapshotResult;
            return (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-semibold mb-1">
                    Email templates ({d.templates.length})
                  </div>
                  {d.templatesError ? (
                    <div className="text-danger text-xs">{d.templatesError}</div>
                  ) : d.templates.length === 0 ? (
                    <div className="text-muted text-xs">None</div>
                  ) : (
                    <ul className="text-muted text-xs space-y-0.5 pl-4 list-disc">
                      {d.templates.map((t) => (
                        <li key={t.id || t.name}>{t.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="font-semibold mb-1">Custom fields ({d.fields.length})</div>
                  {d.fieldsError ? (
                    <div className="text-danger text-xs">{d.fieldsError}</div>
                  ) : d.fields.length === 0 ? (
                    <div className="text-muted text-xs">None</div>
                  ) : (
                    <ul className="text-muted text-xs space-y-0.5 pl-4 list-disc">
                      {d.fields.map((f, i) => (
                        <li key={i}>{f.name || "—"}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="font-semibold mb-1">
                    Recent contacts ({d.contacts.length}
                    {d.contactsTotal > d.contacts.length ? ` of ${d.contactsTotal}` : ""})
                  </div>
                  {d.contactsError ? (
                    <div className="text-danger text-xs">{d.contactsError}</div>
                  ) : d.contacts.length === 0 ? (
                    <div className="text-muted text-xs">No contacts yet — sync hasn&apos;t fired or there are no users yet.</div>
                  ) : (
                    <ul className="text-muted text-xs space-y-0.5 pl-4 list-disc">
                      {d.contacts.map((c) => (
                        <li key={c.id}>
                          <span className="font-mono">{c.email || c.id}</span>
                          {c.tags && c.tags.length > 0 && (
                            <span className="ml-2">
                              {c.tags.slice(0, 4).map((t) => (
                                <span
                                  key={t}
                                  className="inline-block bg-surface-light text-[10px] px-1.5 py-0.5 rounded mr-1"
                                >
                                  {t}
                                </span>
                              ))}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          }}
        />

        {/* Step 5 — manual workflow build in GHL UI */}
        <Step5Workflows />
      </div>
    </div>
  );
}

const WORKFLOW_STATE_KEY = "lr-ghl-workflows-built-v1";

const WORKFLOWS = [
  {
    key: "welcome",
    title: "Welcome on signup",
    tag: "new-user",
    template: "Line Runner — Welcome",
    extra: null as string | null,
  },
  {
    key: "subscriber",
    title: "Subscriber confirmation",
    tag: "subscriber",
    template: "Line Runner — Subscriber Welcome",
    extra: null,
  },
  {
    key: "churn",
    title: "Churn winback",
    tag: "churned",
    template: "Line Runner — Churn Winback",
    extra: "Add a 1-day wait step before the Send email action.",
  },
];

function Step5Workflows() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WORKFLOW_STATE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
  }, []);

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(WORKFLOW_STATE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const completedCount = Object.values(done).filter(Boolean).length;
  const allDone = completedCount === WORKFLOWS.length;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
            allDone ? "bg-success/15 text-success" : "bg-accent/15 text-accent-light"
          }`}
        >
          {allDone ? "✓" : "5"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
            <h2 className="font-semibold">Build the 3 workflows in GHL UI</h2>
            <span className="text-xs text-muted">{completedCount} of {WORKFLOWS.length} built</span>
          </div>
          <p className="text-sm text-muted mb-4">
            GHL workflows can&apos;t be created via API. Open{" "}
            <span className="font-mono text-foreground">
              GHL → Automation → Workflows
            </span>{" "}
            and build each one below. Tick the box when it&apos;s saved and active — your progress
            is remembered locally.
          </p>
          <ul className="space-y-3">
            {WORKFLOWS.map((wf) => {
              const isDone = !!done[wf.key];
              return (
                <li
                  key={wf.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isDone
                      ? "bg-success/5 border-success/30"
                      : "bg-background border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggle(wf.key)}
                    className="mt-1 w-4 h-4 shrink-0 cursor-pointer"
                    aria-label={`Mark ${wf.title} as built`}
                  />
                  <div className="flex-1 min-w-0 text-sm">
                    <div className={`font-semibold ${isDone ? "line-through text-muted" : "text-foreground"}`}>
                      {wf.title}
                    </div>
                    <div className="text-muted text-xs mt-0.5 space-y-0.5">
                      <div>
                        Trigger: <em>Contact tag added</em> ={" "}
                        <code className="bg-surface-light px-1.5 py-0.5 rounded text-foreground">
                          {wf.tag}
                        </code>
                      </div>
                      <div>
                        Action: Send email → Template{" "}
                        <em className="text-foreground">&quot;{wf.template}&quot;</em>
                      </div>
                      {wf.extra && <div className="text-amber-400">{wf.extra}</div>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {allDone && (
            <div className="mt-4 text-sm text-success">
              ✓ All workflows are marked built. Trigger a real signup or checkout to verify GHL is sending emails.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateBodies() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-warning/15 text-warning flex items-center justify-center font-semibold text-sm shrink-0">
          2b
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold mb-1">Paste HTML into each empty template</h2>
          <p className="text-sm text-muted mb-4">
            GHL&apos;s API only creates a template <em>shell</em> — the HTML body has to be pasted
            in once via the GHL UI. Open <span className="font-mono text-foreground">GHL → Marketing → Emails → Templates</span>,
            click each Line Runner template, switch the editor to <strong>HTML / source view</strong>,
            and paste the matching block below.
          </p>
          <div className="space-y-4">
            {EMAIL_TEMPLATES.map((tpl) => (
              <div key={tpl.key} className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{tpl.name}</div>
                    <div className="text-xs text-muted truncate">
                      Subject: <span className="font-mono">{tpl.subject}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copy(tpl.key, tpl.html)}
                    className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-dark transition-colors shrink-0"
                  >
                    {copied === tpl.key ? "✓ Copied" : "Copy HTML"}
                  </button>
                </div>
                <pre className="p-3 text-[11px] text-muted/80 overflow-auto max-h-40 leading-relaxed font-mono whitespace-pre-wrap break-words">
                  {tpl.html}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  state,
  onRun,
  renderOk,
}: {
  number: number;
  title: string;
  description: string;
  action: string;
  state: ActionState;
  onRun: () => void;
  renderOk: (data: unknown) => React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent-light flex items-center justify-center font-semibold text-sm shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <h2 className="font-semibold">{title}</h2>
            <button
              onClick={onRun}
              disabled={state.kind === "running"}
              className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {state.kind === "running" ? "Running…" : state.kind === "ok" ? "Re-run" : "Run"}
            </button>
          </div>
          <p className="text-sm text-muted mb-3">{description}</p>
          {state.kind === "ok" && (
            <div className="bg-background border border-border rounded-lg p-3">
              {renderOk(state.data)}
            </div>
          )}
          {state.kind === "error" && (
            <div className="bg-danger/10 border border-danger/20 text-danger rounded-lg p-3 text-sm break-words">
              {state.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
