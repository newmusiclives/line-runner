import Stripe from "stripe";
import { ensureTable, getSetting, type IntegrationKey } from "@/lib/db/integrations";

// Resolves a config value from env var first, then from the DB integration_settings
// table (so the Admin > Integrations page can also configure Stripe).
async function resolveKey(envVar: string, dbKey: IntegrationKey): Promise<string | null> {
  const env = process.env[envVar];
  if (env) return env;
  try {
    await ensureTable();
    return (await getSetting(dbKey)) || null;
  } catch {
    return null;
  }
}

export async function getStripe(): Promise<Stripe> {
  const key = await resolveKey("STRIPE_SECRET_KEY", "stripe_secret_key");
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export async function isStripeConfigured(): Promise<boolean> {
  const key = await resolveKey("STRIPE_SECRET_KEY", "stripe_secret_key");
  return Boolean(key);
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  return resolveKey("STRIPE_WEBHOOK_SECRET", "stripe_webhook_secret");
}

export async function getStripePriceId(planId: string): Promise<string | null> {
  if (planId === "monthly" || planId === "pro") {
    return resolveKey("STRIPE_PRICE_PRO", "stripe_price_pro");
  }
  if (planId === "studio") {
    return resolveKey("STRIPE_PRICE_STUDIO", "stripe_price_studio");
  }
  return null;
}

export async function planIdFromStripePriceId(priceId: string | undefined | null): Promise<string | null> {
  if (!priceId) return null;
  const proId = await resolveKey("STRIPE_PRICE_PRO", "stripe_price_pro");
  if (proId && priceId === proId) return "monthly";
  const studioId = await resolveKey("STRIPE_PRICE_STUDIO", "stripe_price_studio");
  if (studioId && priceId === studioId) return "studio";
  return null;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3050"
  );
}
