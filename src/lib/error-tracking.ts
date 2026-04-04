import { ensureTable, getSetting } from "@/lib/db/integrations";

let cachedDsn: string | null | undefined = undefined;

async function getDsn(): Promise<string | null> {
  if (cachedDsn !== undefined) return cachedDsn;
  try {
    await ensureTable();
    cachedDsn = await getSetting("sentry_dsn");
    setTimeout(() => { cachedDsn = undefined; }, 60_000);
    return cachedDsn;
  } catch {
    cachedDsn = null;
    return null;
  }
}

export async function captureException(error: Error, context?: Record<string, string>): Promise<void> {
  const dsn = await getDsn();
  if (!dsn) return;

  try {
    // Parse DSN: https://{key}@{host}/{projectId}
    const match = dsn.match(/https:\/\/([^@]+)@([^/]+)\/(.+)/);
    if (!match) return;
    const [, key, host, projectId] = match;

    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}, sentry_client=line-runner/1.0`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "node",
        level: "error",
        logger: "line-runner",
        exception: {
          values: [{
            type: error.name,
            value: error.message,
            stacktrace: { frames: parseStack(error.stack || "") },
          }],
        },
        tags: context || {},
        environment: process.env.NODE_ENV || "development",
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Error tracking should never break the app
  }
}

function parseStack(stack: string): Array<{ filename: string; function: string; lineno: number }> {
  return stack.split("\n").slice(1, 10).map((line) => {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/) || line.match(/at\s+(.+?):(\d+):\d+/);
    if (match) {
      return { function: match[1] || "<anonymous>", filename: match[2] || "", lineno: parseInt(match[3] || "0") };
    }
    return { function: line.trim(), filename: "", lineno: 0 };
  });
}

export async function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): Promise<void> {
  const dsn = await getDsn();
  if (!dsn) return;

  try {
    const match = dsn.match(/https:\/\/([^@]+)@([^/]+)\/(.+)/);
    if (!match) return;
    const [, key, host, projectId] = match;

    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}, sentry_client=line-runner/1.0`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "node",
        level,
        message: { formatted: message },
        environment: process.env.NODE_ENV || "development",
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}
