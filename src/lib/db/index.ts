import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (sql) return sql;
  sql = neon(process.env.DATABASE_URL!);
  return sql;
}
