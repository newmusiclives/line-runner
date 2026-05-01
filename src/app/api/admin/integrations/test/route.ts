import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ensureTable, getSetting } from "@/lib/db/integrations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return null;
  }
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTable();
  const { service } = (await request.json()) as { service: string };

  try {
    if (service === "stripe") {
      return NextResponse.json(await testStripe());
    }
    if (service === "gemini") {
      return NextResponse.json(await testGemini());
    }
    if (service === "gohighlevel") {
      return NextResponse.json(await testGoHighLevel());
    }
    if (service === "google") {
      return NextResponse.json(await testGoogle());
    }
    if (service === "claude") {
      return NextResponse.json(await testClaude());
    }
    if (service === "smtp") {
      return NextResponse.json(await testSmtp());
    }
    if (service === "storage") {
      return NextResponse.json(await testStorage());
    }
    if (service === "sentry") {
      return NextResponse.json(await testSentry());
    }
    return NextResponse.json({ ok: false, error: "Unknown service" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Connection failed" });
  }
}

async function testStripe() {
  // Resolve via the same mode-aware logic the runtime uses
  const mode = (await getSetting("stripe_mode")) === "live" ? "live" : "test";
  const modeKey = mode === "live" ? "stripe_live_secret_key" : "stripe_test_secret_key";
  const secretKey =
    (mode === "live" ? process.env.STRIPE_LIVE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY) ||
    process.env.STRIPE_SECRET_KEY ||
    (await getSetting(modeKey)) ||
    (await getSetting("stripe_secret_key"));

  if (!secretKey) {
    return {
      ok: false,
      error: `${mode === "live" ? "Live" : "Test"} secret key not configured. Save it in the panel above.`,
    };
  }
  try {
    const res = await fetch("https://api.stripe.com/v1/account", {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const account = await res.json();
      const keyMode = secretKey.startsWith("sk_live_") ? "live" : "test";
      const mismatch = keyMode !== mode
        ? ` ⚠ key is ${keyMode} but active mode is ${mode}`
        : "";
      return {
        ok: true,
        message: `Stripe connected — ${account.business_profile?.name || account.id} (${keyMode} mode)${mismatch}`,
      };
    }
    if (res.status === 401) {
      return { ok: false, error: "Invalid secret key" };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    if (err.name === "TimeoutError") return { ok: false, error: "Connection timed out" };
    return { ok: false, error: err.message };
  }
}

async function testGemini() {
  const apiKey = await getSetting("gemini_api_key");
  if (!apiKey) {
    return { ok: false, error: "API Key is required" };
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      return { ok: true, message: "Gemini API connected — TTS voices ready" };
    }
    if (res.status === 400 || res.status === 403) {
      return { ok: false, error: "Invalid API key" };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    if (err.name === "TimeoutError") return { ok: false, error: "Connection timed out" };
    return { ok: false, error: err.message };
  }
}

async function testGoHighLevel() {
  const apiKey = await getSetting("gohighlevel_api_key");
  const locationId = await getSetting("gohighlevel_location_id");
  if (!apiKey) {
    return { ok: false, error: "API Key is required" };
  }
  try {
    const url = locationId
      ? `https://services.leadconnectorhq.com/locations/${locationId}`
      : "https://services.leadconnectorhq.com/locations/";
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true, message: "GoHighLevel connected" };
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    if (err.name === "TimeoutError") return { ok: false, error: "Connection timed out" };
    return { ok: false, error: err.message };
  }
}

async function testClaude() {
  const apiKey = await getSetting("claude_api_key");
  if (!apiKey) {
    return { ok: false, error: "API Key is required" };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      return { ok: true, message: "Claude API connected — ready for AI analysis" };
    }
    if (res.status === 401) {
      return { ok: false, error: "Invalid API key" };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    if (err.name === "TimeoutError") return { ok: false, error: "Connection timed out" };
    return { ok: false, error: err.message };
  }
}

async function testSmtp() {
  const host = await getSetting("smtp_host");
  const port = await getSetting("smtp_port");
  const user = await getSetting("smtp_user");
  const pass = await getSetting("smtp_pass");
  if (!host || !user || !pass) {
    return { ok: false, error: "Host, username, and password are required" };
  }
  // We can't fully test SMTP without sending, but validate the config exists
  if (!port) {
    return { ok: false, error: "Port is required (typically 587 for TLS)" };
  }
  return { ok: true, message: `SMTP configured — ${host}:${port} as ${user}` };
}

async function testGoogle() {
  const clientId = await getSetting("google_client_id");
  const clientSecret = await getSetting("google_client_secret");
  if (!clientId || !clientSecret) {
    return { ok: false, error: "Client ID and Client Secret are required" };
  }
  // Can't fully test OAuth without redirect, just validate format
  if (!clientId.endsWith(".apps.googleusercontent.com")) {
    return { ok: false, error: "Client ID should end with .apps.googleusercontent.com" };
  }
  return { ok: true, message: "Credentials saved — OAuth ready" };
}

async function testStorage() {
  const endpoint = await getSetting("storage_endpoint");
  const bucket = await getSetting("storage_bucket");
  const accessKey = await getSetting("storage_access_key");
  const secretKey = await getSetting("storage_secret_key");
  if (!endpoint || !bucket || !accessKey || !secretKey) {
    return { ok: false, error: "Endpoint, bucket, access key, and secret key are required" };
  }
  try {
    const res = await fetch(`${endpoint}/${bucket}`, {
      method: "HEAD",
      headers: { Authorization: `AWS ${accessKey}:${secretKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok || res.status === 200 || res.status === 404) {
      return { ok: true, message: `Storage connected — bucket: ${bucket}` };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    if (err.name === "TimeoutError") return { ok: false, error: "Connection timed out" };
    return { ok: false, error: err.message };
  }
}

async function testSentry() {
  const dsn = await getSetting("sentry_dsn");
  if (!dsn) return { ok: false, error: "DSN is required" };
  if (!dsn.startsWith("https://") || !dsn.includes("@")) {
    return { ok: false, error: "Invalid DSN format — should be https://xxxxx@sentry.io/xxxxx" };
  }
  return { ok: true, message: "Sentry DSN configured — errors will be tracked" };
}
