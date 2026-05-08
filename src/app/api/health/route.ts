import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isStripeConfigured, getStripeMode } from "@/lib/stripe";
import { ensureTable, getSetting } from "@/lib/db/integrations";

export const runtime = "nodejs";

// Lightweight readiness probe. Useful for Netlify monitoring and for the
// operator's smoke test ("is everything wired up?"). Reports DB reachability
// and which third-party integrations are configured. Never returns secrets.
export async function GET() {
  const startedAt = Date.now();

  let dbOk = false;
  let dbError: string | null = null;
  try {
    const sql = getDb();
    await sql`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "unknown";
  }

  let stripeOk = false;
  let stripeMode: "test" | "live" | null = null;
  if (dbOk) {
    try {
      stripeOk = await isStripeConfigured();
      if (stripeOk) stripeMode = await getStripeMode();
    } catch {}
  }

  let geminiOk = false;
  let ghlOk = false;
  if (dbOk) {
    try {
      await ensureTable();
      geminiOk = Boolean((await getSetting("gemini_api_key")) || process.env.GEMINI_API_KEY);
      ghlOk = Boolean(await getSetting("gohighlevel_api_key"));
    } catch {}
  }

  const authSecretSet = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);

  return NextResponse.json(
    {
      ok: dbOk && authSecretSet,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      services: {
        database: dbOk ? "ok" : "error",
        databaseError: dbError,
        stripe: stripeOk ? `configured (${stripeMode})` : "not configured",
        gemini: geminiOk ? "configured" : "not configured (voice degrades to browser TTS)",
        ghl: ghlOk ? "configured" : "not configured (no email/CRM sync)",
      },
      env: {
        authSecret: authSecretSet ? "set" : "MISSING — site will refuse production boot",
        nodeEnv: process.env.NODE_ENV,
      },
    },
    { status: dbOk && authSecretSet ? 200 : 503 }
  );
}
