import { neon } from "@neondatabase/serverless";
import "dotenv/config";

// One-shot migration: bump existing free-tier rows from old quotas (2.5 / 3)
// to the current 5-minute policy. Safe to re-run — only touches free rows
// where minutes_included is less than 5.
//
// Run: npx tsx scripts/bump-free-minutes.ts

async function bumpFreeMinutes() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Aborting.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const before = await sql`
    SELECT minutes_included, COUNT(*)::int AS n
    FROM subscriptions
    WHERE plan_id = 'free'
    GROUP BY minutes_included
    ORDER BY minutes_included
  `;
  console.log("Free-tier rows before:");
  console.table(before);

  const updated = await sql`
    UPDATE subscriptions
    SET minutes_included = 5
    WHERE plan_id = 'free' AND minutes_included < 5
    RETURNING id
  `;
  console.log(`Updated ${updated.length} row(s).`);

  // Voices column gets the same treatment so the dashboard "6 voices" copy
  // matches the per-row stored value for older accounts (was 1 or 3).
  const updatedVoices = await sql`
    UPDATE subscriptions
    SET voices_included = 6
    WHERE plan_id = 'free' AND voices_included < 6
    RETURNING id
  `;
  console.log(`Updated voices on ${updatedVoices.length} row(s).`);

  const after = await sql`
    SELECT minutes_included, voices_included, COUNT(*)::int AS n
    FROM subscriptions
    WHERE plan_id = 'free'
    GROUP BY minutes_included, voices_included
    ORDER BY minutes_included
  `;
  console.log("Free-tier rows after:");
  console.table(after);
}

bumpFreeMinutes().catch((err) => {
  console.error(err);
  process.exit(1);
});
