import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ensureTable, getSetting } from "@/lib/db/integrations";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { SUPPORT_EMAIL } from "@/lib/contact";

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

// Email template HTML lives in src/lib/email-templates.ts so the admin UI
// can render the same content for copy-paste.

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

  for (const tpl of EMAIL_TEMPLATES) {
    const res = await ghlRequest<{ id?: string; templateId?: string; _id?: string }>(
      apiKey,
      "/emails/builder",
      {
        method: "POST",
        body: JSON.stringify({
          locationId,
          name: tpl.name,
          title: tpl.name, // GHL UI shows `title` as the visible template name
          type: "html",
          subject: tpl.subject,
          html: tpl.html,
          fromEmail: SUPPORT_EMAIL,
          fromName: "Line Runner",
        }),
      }
    );
    const id = res.data?.id || res.data?.templateId || res.data?._id;
    results.push({
      name: tpl.name,
      ok: res.ok,
      message: res.ok
        ? `Created shell (id: ${id || "unknown"}). Paste the HTML in step 2b — GHL's API doesn't accept body content on create.`
        : (res.error || "Unknown error"),
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

  // GHL stores fieldKey as "contact.subscription_status" — match against both
  // the prefixed and stripped form, plus the human-readable name (case-insensitive).
  const existing = new Set<string>();
  for (const f of existingRes.data?.customFields || []) {
    if (f.fieldKey) {
      existing.add(f.fieldKey);
      const dot = f.fieldKey.indexOf(".");
      if (dot >= 0) existing.add(f.fieldKey.slice(dot + 1));
    }
    if (f.name) existing.add(f.name.toLowerCase());
  }

  const results: { name: string; ok: boolean; message: string }[] = [];

  for (const field of CUSTOM_FIELDS) {
    if (
      existing.has(field.fieldKey) ||
      existing.has(`contact.${field.fieldKey}`) ||
      existing.has(field.name.toLowerCase())
    ) {
      results.push({ name: field.name, ok: true, message: "Already exists" });
      continue;
    }
    const res = await ghlRequest<{ customField?: { id?: string } }>(
      apiKey,
      `/locations/${locationId}/customFields`,
      {
        method: "POST",
        body: JSON.stringify({
          name: field.name,
          dataType: field.dataType,
          placeholder: field.placeholder,
          model: "contact",
        }),
      }
    );
    // GHL also returns 400 with "already exists" if the create races a fresh field.
    // Treat that as success in our results so re-runs are clean.
    if (!res.ok && res.error?.includes("already exists")) {
      results.push({ name: field.name, ok: true, message: "Already exists" });
      continue;
    }
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
    ghlRequest<unknown>(
      apiKey,
      `/emails/builder?locationId=${locationId}&limit=100&templatesOnly=true`
    ),
    ghlRequest<{ customFields?: Array<{ name?: string }> }>(
      apiKey,
      `/locations/${locationId}/customFields?model=contact`
    ),
    ghlRequest<{
      contacts?: Array<{ id: string; email?: string; tags?: string[] }>;
      total?: number;
    }>(apiKey, `/contacts/search`, {
      method: "POST",
      body: JSON.stringify({ locationId, pageLimit: 10 }),
    }),
  ]);

  // GHL's response shape for /emails/builder is inconsistent — try several
  // common keys and fall back to any array of objects in the payload.
  const templates = extractArray<{ name?: string; title?: string; id?: string }>(
    tplRes.data,
    ["templates", "data", "records", "result", "results"]
  ).map((t) => ({
    name: t.name || t.title || "(unnamed)",
    id: t.id,
  }));

  return {
    ok: true,
    templates,
    templatesError: tplRes.ok ? null : tplRes.error,
    fields: fieldsRes.data?.customFields || [],
    fieldsError: fieldsRes.ok ? null : fieldsRes.error,
    contacts: contactsRes.data?.contacts || [],
    contactsTotal: contactsRes.data?.total ?? (contactsRes.data?.contacts?.length ?? 0),
    contactsError: contactsRes.ok ? null : contactsRes.error,
  };
}

function extractArray<T = Record<string, unknown>>(payload: unknown, preferredKeys: string[]): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of preferredKeys) {
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  // Fallback: find any property that's a non-empty array of objects
  for (const value of Object.values(obj)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      return value as T[];
    }
  }
  return [];
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
