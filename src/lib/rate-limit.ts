import { getDb } from "@/lib/db";

// Persistent rate limiter backed by Neon Postgres.
//
// The previous implementation was an in-memory Map, which does not survive
// across serverless instances: two requests from the same client can land on
// different lambdas, each with its own empty counter, so the limit is only ever
// enforced per warm instance. Persisting the counter to the DB we already run
// makes the limit hold across the whole fleet — and needs no new operator keys
// (unlike an Upstash/Redis add-on). This mirrors the DB-backed approach used for
// rehearsal remote-control.
//
// The counter row is updated atomically in a single upsert so concurrent
// requests can't race the read-modify-write. If the DB is unreachable we fall
// back to the in-memory limiter rather than throwing — rate limiting is
// best-effort protection and must never take down the route it guards.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    const sql = getDb();
    tableReady = sql`CREATE TABLE IF NOT EXISTS rate_limits (
      key      TEXT PRIMARY KEY,
      count    INTEGER NOT NULL,
      reset_at BIGINT NOT NULL
    )`.then(() => undefined);
    // Don't cache a rejection forever — let a later call retry the create.
    tableReady.catch(() => { tableReady = null; });
  }
  return tableReady;
}

// Opportunistic cleanup of expired rows so the table can't grow without bound
// as unique keys (per-email, per-user-action) accumulate. Gated so we only
// sweep occasionally rather than on every request.
let callsSinceSweep = 0;
async function maybeSweep(now: number): Promise<void> {
  if (++callsSinceSweep < 500) return;
  callsSinceSweep = 0;
  try {
    const sql = getDb();
    await sql`DELETE FROM rate_limits WHERE reset_at < ${now}`;
  } catch {
    // Best-effort; a failed sweep just means rows linger until the next one.
  }
}

export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 900000 // 15 minutes
): Promise<RateLimitResult> {
  const now = Date.now();

  try {
    await ensureTable();
    const sql = getDb();
    // Atomic increment-or-reset: if the stored window has expired, start a fresh
    // window at count 1; otherwise bump the existing count. RETURNING gives us
    // the post-update state to decide allowed/remaining.
    const rows = await sql`INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${now + windowMs})
      ON CONFLICT (key) DO UPDATE SET
        count    = CASE WHEN rate_limits.reset_at < ${now} THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at < ${now} THEN ${now + windowMs} ELSE rate_limits.reset_at END
      RETURNING count, reset_at`;

    const row = rows[0] as { count: number; reset_at: string | number } | undefined;
    if (!row) return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs };

    const count = Number(row.count);
    const resetAt = Number(row.reset_at);
    void maybeSweep(now);

    return {
      allowed: count <= maxAttempts,
      remaining: Math.max(0, maxAttempts - count),
      resetIn: Math.max(0, resetAt - now),
    };
  } catch {
    // DB unavailable — degrade to the in-memory limiter (per-instance only).
    return memoryCheck(key, maxAttempts, windowMs, now);
  }
}

// ---- In-memory fallback (per-instance, used only when the DB is down) ----

const attempts = new Map<string, { count: number; resetAt: number }>();

function memoryCheck(
  key: string,
  maxAttempts: number,
  windowMs: number,
  now: number
): RateLimitResult {
  const entry = attempts.get(key);

  if (attempts.size > 10000) {
    for (const [k, v] of attempts) {
      if (v.resetAt < now) attempts.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetIn: entry.resetAt - now };
}
