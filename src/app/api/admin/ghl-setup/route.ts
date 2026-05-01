import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ensureTable, getSetting } from "@/lib/db/integrations";

const GHL_BASE = "https://services.leadconnectorhq.com";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return null;
  }
  return session;
}

async function getCreds() {
  await ensureTable();
  const apiKey = await getSetting("gohighlevel_api_key");
  const locationId = await getSetting("gohighlevel_location_id");
  if (!apiKey || !locationId) {
    return { ok: false as const, error: "GoHighLevel API Key and Location ID must be saved in Admin → Integrations first" };
  }
  return { ok: true as const, apiKey, locationId };
}

function ghlHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Version: "2021-07-28",
  };
}

async function ghlRequest<T = unknown>(
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(`${GHL_BASE}${path}`, {
      ...init,
      headers: { ...ghlHeaders(apiKey), ...(init?.headers || {}) },
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      // non-JSON response
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: `HTTP ${res.status}: ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

// ── Email template HTML ────────────────────────────────────────────

const SHELL_STYLES = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; color: #e4e4e7; padding: 40px 24px; border-radius: 16px;`;

function emailWelcome() {
  return {
    name: "Line Runner — Welcome",
    subject: "Welcome to Line Runner — start your first rehearsal",
    html: `
<div style="max-width: 480px; margin: 0 auto; ${SHELL_STYLES}">
  <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Welcome to Line Runner</h1>
  <p style="color: #71717a; font-size: 14px; margin: 0 0 24px;">Hi {{contact.first_name}}, your account is ready.</p>
  <p style="font-size: 15px; line-height: 1.6;">
    Line Runner lets actors and voice artists rehearse with AI scene partners — upload a script, pick your part, and run lines on demand.
  </p>
  <ol style="font-size: 14px; line-height: 1.8; color: #a1a1aa; padding-left: 20px;">
    <li>Upload a PDF or text script</li>
    <li>Pick the character you're playing</li>
    <li>Hit <em>Start Rehearsal</em> — the AI reads every other line aloud</li>
  </ol>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://rehearse-perform-earn.netlify.app/upload" style="display: inline-block; background: #6c5ce7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Upload your first script</a>
  </div>
  <p style="font-size: 13px; color: #71717a;">Free plan includes 1 scene/month and the four core tools (Script Analysis, Line Memory, Bookmarks, Teleprompter). Upgrade anytime for unlimited rehearsals and more voice minutes.</p>
  <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
  <p style="font-size: 12px; color: #52525b; text-align: center;">Line Runner — AI Script Rehearsal · <a href="https://rehearse-perform-earn.netlify.app" style="color: #71717a;">linerunner.app</a></p>
</div>`,
  };
}

function emailSubscriber() {
  return {
    name: "Line Runner — Subscriber Welcome",
    subject: "You're in — welcome to Line Runner",
    html: `
<div style="max-width: 480px; margin: 0 auto; ${SHELL_STYLES}">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background: rgba(34, 197, 94, 0.15); color: #4ade80; font-weight: 600; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; padding: 6px 12px; border-radius: 999px;">Subscription active</div>
  </div>
  <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Thanks, {{contact.first_name}} — you're in.</h1>
  <p style="font-size: 15px; line-height: 1.6;">Your Line Runner subscription is live. Here's what unlocks right now:</p>
  <ul style="font-size: 14px; line-height: 1.8; color: #a1a1aa; padding-left: 20px;">
    <li>Unlimited scene runs (was 1/month on Free)</li>
    <li>10× more voice minutes per month</li>
    <li>More AI voices per script</li>
  </ul>
  <p style="font-size: 14px; color: #a1a1aa;">Some advanced features (AI Performance Coach, Self-Tape Studio, Audition Vault, Scene Exchange) are still rolling out — your subscription locks them in at this price when they ship.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://rehearse-perform-earn.netlify.app/dashboard" style="display: inline-block; background: #6c5ce7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Go to dashboard</a>
  </div>
  <p style="font-size: 13px; color: #71717a;">A receipt has been emailed to you by Stripe. Manage your subscription anytime at <a href="https://rehearse-perform-earn.netlify.app/dashboard/subscription" style="color: #a78bfa;">Account → Subscription</a>.</p>
  <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
  <p style="font-size: 12px; color: #52525b; text-align: center;">Line Runner — AI Script Rehearsal</p>
</div>`,
  };
}

function emailChurn() {
  return {
    name: "Line Runner — Churn Winback",
    subject: "You're always welcome back at Line Runner",
    html: `
<div style="max-width: 480px; margin: 0 auto; ${SHELL_STYLES}">
  <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Sorry to see you go, {{contact.first_name}}</h1>
  <p style="font-size: 15px; line-height: 1.6;">Your Line Runner subscription has been cancelled. You'll keep access to paid features until the end of your current billing period — after that, your account moves to the Free plan.</p>
  <p style="font-size: 15px; line-height: 1.6;">If something didn't work for you, we'd love to know. Reply to this email — a real human will read it.</p>
  <p style="font-size: 15px; line-height: 1.6;">Your scripts, rehearsal history, and bookmarks stay safe on your account. Come back any time.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://rehearse-perform-earn.netlify.app/dashboard" style="display: inline-block; background: #6c5ce7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Open Line Runner</a>
  </div>
  <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
  <p style="font-size: 12px; color: #52525b; text-align: center;">Line Runner — AI Script Rehearsal</p>
</div>`,
  };
}

const TEMPLATES = [emailWelcome, emailSubscriber, emailChurn];

const CUSTOM_FIELDS = [
  { name: "Subscription Status", dataType: "TEXT", placeholder: "active|cancelled|past_due", fieldKey: "subscription_status" },
  { name: "Current Plan", dataType: "TEXT", placeholder: "free|pro|studio", fieldKey: "current_plan" },
  { name: "Stripe Customer ID", dataType: "TEXT", placeholder: "cus_...", fieldKey: "stripe_customer_id" },
  { name: "Scripts Uploaded", dataType: "NUMERICAL", placeholder: "0", fieldKey: "scripts_uploaded" },
];

// ── Action handlers ────────────────────────────────────────────────

async function actionVerify(apiKey: string, locationId: string) {
  const res = await ghlRequest<{ id?: string; name?: string }>(
    apiKey,
    `/locations/${locationId}`
  );
  if (!res.ok) return { ok: false, message: res.error };
  return {
    ok: true,
    message: `Connected to "${res.data?.name || locationId}"`,
    location: res.data,
  };
}

async function actionTemplates(apiKey: string, locationId: string) {
  const results: { name: string; ok: boolean; message: string; id?: string }[] = [];

  for (const builder of TEMPLATES) {
    const tpl = builder();
    const res = await ghlRequest<{ id?: string; templateId?: string; _id?: string }>(
      apiKey,
      "/emails/builder",
      {
        method: "POST",
        body: JSON.stringify({
          locationId,
          name: tpl.name,
          type: "html",
          subject: tpl.subject,
          html: tpl.html,
          fromEmail: "hello@linerunner.app",
          fromName: "Line Runner",
        }),
      }
    );
    const id = res.data?.id || res.data?.templateId || res.data?._id;
    results.push({
      name: tpl.name,
      ok: res.ok,
      message: res.ok ? `Created template (id: ${id || "unknown"})` : (res.error || "Unknown error"),
      id,
    });
  }
  return { ok: results.every((r) => r.ok), results };
}

async function actionFields(apiKey: string, locationId: string) {
  const existingRes = await ghlRequest<{ customFields?: Array<{ name?: string; fieldKey?: string }> }>(
    apiKey,
    `/locations/${locationId}/customFields?model=contact`
  );
  const existing = new Set(
    (existingRes.data?.customFields || []).map((f) => f.fieldKey || f.name).filter(Boolean) as string[]
  );

  const results: { name: string; ok: boolean; message: string }[] = [];

  for (const field of CUSTOM_FIELDS) {
    if (existing.has(field.fieldKey) || existing.has(field.name)) {
      results.push({ name: field.name, ok: true, message: "Already exists" });
      continue;
    }
    const res = await ghlRequest(apiKey, `/locations/${locationId}/customFields`, {
      method: "POST",
      body: JSON.stringify({
        name: field.name,
        dataType: field.dataType,
        placeholder: field.placeholder,
        model: "contact",
      }),
    });
    results.push({
      name: field.name,
      ok: res.ok,
      message: res.ok ? "Created" : (res.error || "Unknown error"),
    });
  }
  return { ok: results.every((r) => r.ok), results };
}

async function actionSnapshot(apiKey: string, locationId: string) {
  const [tplRes, fieldsRes, contactsRes] = await Promise.all([
    ghlRequest<{ templates?: Array<{ name: string; id?: string }> }>(
      apiKey,
      `/emails/templates?locationId=${locationId}&limit=20`
    ),
    ghlRequest<{ customFields?: Array<{ name?: string }> }>(
      apiKey,
      `/locations/${locationId}/customFields?model=contact`
    ),
    ghlRequest<{ contacts?: Array<{ id: string; email?: string; tags?: string[] }>; total?: number }>(
      apiKey,
      `/contacts/?locationId=${locationId}&limit=10`
    ),
  ]);

  return {
    ok: true,
    templates: tplRes.data?.templates || [],
    templatesError: tplRes.ok ? null : tplRes.error,
    fields: fieldsRes.data?.customFields || [],
    fieldsError: fieldsRes.ok ? null : fieldsRes.error,
    contacts: contactsRes.data?.contacts || [],
    contactsTotal: contactsRes.data?.total ?? 0,
    contactsError: contactsRes.ok ? null : contactsRes.error,
  };
}

// ── Route handler ──────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creds = await getCreds();
  if (!creds.ok) {
    return NextResponse.json({ error: creds.error }, { status: 400 });
  }

  const { action } = (await request.json()) as { action: string };

  switch (action) {
    case "verify":
      return NextResponse.json(await actionVerify(creds.apiKey, creds.locationId));
    case "templates":
      return NextResponse.json(await actionTemplates(creds.apiKey, creds.locationId));
    case "fields":
      return NextResponse.json(await actionFields(creds.apiKey, creds.locationId));
    case "snapshot":
      return NextResponse.json(await actionSnapshot(creds.apiKey, creds.locationId));
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
