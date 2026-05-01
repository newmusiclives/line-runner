import { getDb } from "./index";

export interface IntegrationSetting {
  key: string;
  value: string;
  updated_at: string;
}

const VALID_KEYS = [
  // Manifest Financial (deprecated — kept for back-compat with old saved values)
  "manifest_api_url",
  "manifest_secret_key",
  // Stripe — legacy single-key fields (kept for back-compat)
  "stripe_secret_key",
  "stripe_webhook_secret",
  "stripe_price_pro",
  "stripe_price_studio",
  // Stripe — mode-aware
  "stripe_mode",
  "stripe_test_secret_key",
  "stripe_test_webhook_secret",
  "stripe_test_price_pro",
  "stripe_test_price_studio",
  "stripe_live_secret_key",
  "stripe_live_webhook_secret",
  "stripe_live_price_pro",
  "stripe_live_price_studio",
  // Gemini Voices
  "gemini_api_key",
  // GoHighLevel
  "gohighlevel_api_key",
  "gohighlevel_location_id",
  // Google OAuth
  "google_client_id",
  "google_client_secret",
  // Claude AI
  "claude_api_key",
  // SMTP Email
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "smtp_from_email",
  "smtp_from_name",
  // Cloud Storage (S3-compatible)
  "storage_endpoint",
  "storage_bucket",
  "storage_access_key",
  "storage_secret_key",
  "storage_public_url",
  // Sentry
  "sentry_dsn",
] as const;

export type IntegrationKey = (typeof VALID_KEYS)[number];

export function isValidKey(key: string): key is IntegrationKey {
  return (VALID_KEYS as readonly string[]).includes(key);
}

export async function ensureTable() {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS integration_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT DEFAULT (now())
  )`;
}

export async function getSetting(key: IntegrationKey): Promise<string | null> {
  const sql = getDb();
  const rows = await sql`SELECT value FROM integration_settings WHERE key = ${key}`;
  return (rows[0] as any)?.value ?? null;
}

export async function getSettings(keys: IntegrationKey[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = await getSetting(key);
  }
  return result;
}

export async function getAllSettings(): Promise<IntegrationSetting[]> {
  const sql = getDb();
  const rows = await sql`SELECT key, value, updated_at FROM integration_settings ORDER BY key`;
  return rows as IntegrationSetting[];
}

export async function upsertSetting(key: IntegrationKey, value: string): Promise<void> {
  const sql = getDb();
  const now = new Date().toISOString();
  await sql`INSERT INTO integration_settings (key, value, updated_at)
    VALUES (${key}, ${value}, ${now})
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = ${now}`;
}

export async function deleteSetting(key: IntegrationKey): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM integration_settings WHERE key = ${key}`;
}
