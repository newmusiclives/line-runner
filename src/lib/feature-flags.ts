import "server-only";
import { getDb } from "@/lib/db";

export type FlagMap = Record<string, boolean>;

// If the DB is unreachable we want public marketing pages to keep rendering.
// Defaulting to "all enabled" means no false "Coming Soon" badges show during
// an outage; the trade-off is a feature pretends to be live for as long as
// the DB is down, which is acceptable for marketing surfaces.
const FALLBACK: FlagMap = {};

export async function getFeatureFlags(): Promise<FlagMap> {
  try {
    const sql = getDb();
    const rows = (await sql`SELECT key, enabled FROM feature_flags`) as Array<{
      key: string;
      enabled: boolean;
    }>;
    const map: FlagMap = {};
    for (const row of rows) {
      map[row.key] = row.enabled === true;
    }
    return map;
  } catch {
    return FALLBACK;
  }
}

// `flags[key]` is true → on, false → off.
// Missing key → treat as enabled (matches checkFeatureAccess default in
// subscription-guard.ts). Off only when row exists and `enabled = false`.
export function isFlagOff(flags: FlagMap, key: string): boolean {
  return flags[key] === false;
}

// Coming-soon iff EVERY listed key is off. Used for meta-features like
// "10 Rehearsal Modes" or "Income Streams" that bundle several flags.
export function allOff(flags: FlagMap, keys: readonly string[]): boolean {
  if (keys.length === 0) return false;
  return keys.every((k) => isFlagOff(flags, k));
}

// Coming-soon iff ANY listed key is off. Used when an advertised feature
// only counts as "live" if all of its sub-features are also live (e.g.
// "All 10 rehearsal modes" reads as Soon if even one mode is disabled).
export function anyOff(flags: FlagMap, keys: readonly string[]): boolean {
  return keys.some((k) => isFlagOff(flags, k));
}
