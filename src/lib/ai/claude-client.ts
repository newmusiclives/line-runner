import { ensureTable, getSetting } from "@/lib/db/integrations";

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

let cachedApiKey: string | null | undefined = undefined;

async function getApiKey(): Promise<string | null> {
  if (cachedApiKey !== undefined) return cachedApiKey;
  try {
    await ensureTable();
    cachedApiKey = await getSetting("claude_api_key");
    // Refresh cache every 60 seconds
    setTimeout(() => {
      cachedApiKey = undefined;
    }, 60_000);
    return cachedApiKey;
  } catch {
    cachedApiKey = null;
    return null;
  }
}

export async function isClaudeAvailable(): Promise<boolean> {
  const key = await getApiKey();
  return !!key;
}

export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string | null> {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: options?.maxTokens || 1024,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;
    const data: ClaudeResponse = await res.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

// Convenience: ask Claude and parse JSON response
export async function askClaudeJson<T>(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<T | null> {
  const text = await askClaude(systemPrompt, userMessage, options);
  if (!text) return null;
  try {
    // Extract JSON from response (Claude sometimes wraps in markdown)
    const jsonMatch =
      text.match(/```json\s*([\s\S]*?)\s*```/) ||
      text.match(/\[[\s\S]*\]/) ||
      text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
