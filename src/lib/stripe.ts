import Stripe from "stripe";
import { ensureTable, getSetting, type IntegrationKey } from "@/lib/db/integrations";

export type StripeMode = "test" | "live";

export async function getStripeMode(): Promise<StripeMode> {
  try {
    await ensureTable();
    const mode = await getSetting("stripe_mode");
    return mode === "live" ? "live" : "test";
  } catch {
    return "test";
  }
}

// Resolves a Stripe config value with mode-specific values winning over
// legacy single-key fallbacks (so the admin toggle is authoritative even
// when old single-key env vars are still set on Netlify):
// 1. Mode-specific env var (STRIPE_TEST_SECRET_KEY / STRIPE_LIVE_SECRET_KEY)
// 2. Mode-specific DB key (stripe_test_secret_key / stripe_live_secret_key)
// 3. Legacy single env var (STRIPE_SECRET_KEY)
// 4. Legacy single DB key (stripe_secret_key)
async function resolveModedKey(opts: {
  modeEnvVars: { test: string; live: string };
  legacyEnvVar: string;
  modeDbKeys: { test: IntegrationKey; live: IntegrationKey };
  legacyDbKey: IntegrationKey;
}): Promise<string | null> {
  const mode = await getStripeMode();

  const envForMode = process.env[opts.modeEnvVars[mode]];
  if (envForMode) return envForMode;

  try {
    await ensureTable();
    const dbForMode = await getSetting(opts.modeDbKeys[mode]);
    if (dbForMode) return dbForMode;
  } catch {
    // DB unreachable — fall through to legacy
  }

  const legacyEnv = process.env[opts.legacyEnvVar];
  if (legacyEnv) return legacyEnv;

  try {
    return (await getSetting(opts.legacyDbKey)) || null;
  } catch {
    return null;
  }
}

export async function getStripe(): Promise<Stripe> {
  const key = await resolveModedKey({
    modeEnvVars: { test: "STRIPE_TEST_SECRET_KEY", live: "STRIPE_LIVE_SECRET_KEY" },
    legacyEnvVar: "STRIPE_SECRET_KEY",
    modeDbKeys: { test: "stripe_test_secret_key", live: "stripe_live_secret_key" },
    legacyDbKey: "stripe_secret_key",
  });
  if (!key) {
    throw new Error("Stripe secret key is not configured");
  }
  return new Stripe(key);
}

export async function isStripeConfigured(): Promise<boolean> {
  const key = await resolveModedKey({
    modeEnvVars: { test: "STRIPE_TEST_SECRET_KEY", live: "STRIPE_LIVE_SECRET_KEY" },
    legacyEnvVar: "STRIPE_SECRET_KEY",
    modeDbKeys: { test: "stripe_test_secret_key", live: "stripe_live_secret_key" },
    legacyDbKey: "stripe_secret_key",
  });
  return Boolean(key);
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  return resolveModedKey({
    modeEnvVars: { test: "STRIPE_TEST_WEBHOOK_SECRET", live: "STRIPE_LIVE_WEBHOOK_SECRET" },
    legacyEnvVar: "STRIPE_WEBHOOK_SECRET",
    modeDbKeys: { test: "stripe_test_webhook_secret", live: "stripe_live_webhook_secret" },
    legacyDbKey: "stripe_webhook_secret",
  });
}

export async function getStripePriceId(planId: string): Promise<string | null> {
  if (planId === "monthly" || planId === "pro") {
    return resolveModedKey({
      modeEnvVars: { test: "STRIPE_TEST_PRICE_PRO", live: "STRIPE_LIVE_PRICE_PRO" },
      legacyEnvVar: "STRIPE_PRICE_PRO",
      modeDbKeys: { test: "stripe_test_price_pro", live: "stripe_live_price_pro" },
      legacyDbKey: "stripe_price_pro",
    });
  }
  if (planId === "studio") {
    return resolveModedKey({
      modeEnvVars: { test: "STRIPE_TEST_PRICE_STUDIO", live: "STRIPE_LIVE_PRICE_STUDIO" },
      legacyEnvVar: "STRIPE_PRICE_STUDIO",
      modeDbKeys: { test: "stripe_test_price_studio", live: "stripe_live_price_studio" },
      legacyDbKey: "stripe_price_studio",
    });
  }
  return null;
}

// Maps a Stripe price id (from a webhook event) back to one of our internal plan ids.
// Checks both test and live price IDs since webhooks can fire from either side.
export async function planIdFromStripePriceId(priceId: string | undefined | null): Promise<string | null> {
  if (!priceId) return null;

  const proIds = [
    process.env.STRIPE_TEST_PRICE_PRO,
    process.env.STRIPE_LIVE_PRICE_PRO,
    process.env.STRIPE_PRICE_PRO,
  ].filter(Boolean);
  if (proIds.includes(priceId)) return "monthly";

  const studioIds = [
    process.env.STRIPE_TEST_PRICE_STUDIO,
    process.env.STRIPE_LIVE_PRICE_STUDIO,
    process.env.STRIPE_PRICE_STUDIO,
  ].filter(Boolean);
  if (studioIds.includes(priceId)) return "studio";

  try {
    await ensureTable();
    const dbProTest = await getSetting("stripe_test_price_pro");
    const dbProLive = await getSetting("stripe_live_price_pro");
    const dbProLegacy = await getSetting("stripe_price_pro");
    if ([dbProTest, dbProLive, dbProLegacy].includes(priceId)) return "monthly";

    const dbStudioTest = await getSetting("stripe_test_price_studio");
    const dbStudioLive = await getSetting("stripe_live_price_studio");
    const dbStudioLegacy = await getSetting("stripe_price_studio");
    if ([dbStudioTest, dbStudioLive, dbStudioLegacy].includes(priceId)) return "studio";
  } catch {
    // DB unavailable
  }

  return null;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3050"
  );
}
