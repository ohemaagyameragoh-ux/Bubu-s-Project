// Thin wrapper over the Anthropic API (Claude). The statement analyzer and price forecasting
// use it when an API key is configured. When it is not, callers fall back to a deterministic
// heuristic, so the product works in development with no key. Default models: Haiku for cheap,
// high volume classification, Sonnet for the heavier forecasting reasoning.
const KEY = process.env.ANTHROPIC_API_KEY;

export const aiEnabled = Boolean(KEY);

export const AI_MODELS = {
  classify: "claude-haiku-4-5",
  forecast: "claude-sonnet-4-6",
} as const;

// Ask Claude for a JSON answer. Returns the parsed value, or null on any failure so callers can
// fall back gracefully. We extract the first JSON object or array from the response text.
export async function anthropicJSON<T = unknown>(
  model: string,
  system: string,
  prompt: string,
  maxTokens = 1024,
): Promise<T | null> {
  if (!KEY) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = (data.content ?? []).map((c) => c.text ?? "").join("");
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as T) : null;
  } catch {
    return null;
  }
}
