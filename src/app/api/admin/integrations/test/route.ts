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
    if (service === "manifest") {
      return NextResponse.json(await testManifest());
    }
    if (service === "elevenlabs") {
      return NextResponse.json(await testElevenLabs());
    }
    if (service === "gohighlevel") {
      return NextResponse.json(await testGoHighLevel());
    }
    if (service === "google") {
      return NextResponse.json(await testGoogle());
    }
    return NextResponse.json({ ok: false, error: "Unknown service" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Connection failed" });
  }
}

async function testManifest() {
  const apiUrl = await getSetting("manifest_api_url");
  const secretKey = await getSetting("manifest_secret_key");
  if (!apiUrl || !secretKey) {
    return { ok: false, error: "API URL and Secret Key are required" };
  }
  try {
    const res = await fetch(`${apiUrl}/ping`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true, message: "Manifest Financial connected" };
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    if (err.name === "TimeoutError") return { ok: false, error: "Connection timed out" };
    return { ok: false, error: err.message };
  }
}

async function testElevenLabs() {
  const apiKey = await getSetting("elevenlabs_api_key");
  if (!apiKey) {
    return { ok: false, error: "API Key is required" };
  }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        message: `Connected — ${data.subscription?.character_limit?.toLocaleString() || "N/A"} character limit`,
      };
    }
    return { ok: false, error: `HTTP ${res.status}: Invalid API key` };
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
