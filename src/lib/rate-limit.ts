// Simple in-memory rate limiter for serverless
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 900000 // 15 minutes
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  // Clean up expired entries periodically
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
