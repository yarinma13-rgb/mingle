/**
 * Thin Gemini REST client. Uses GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY).
 * No SDK dependency — fetch only, following other server env patterns in the repo.
 */

// gemini-2.0-flash was shut down on 2026-06-01; Google's recommended
// replacement has no shutdown date announced. Override with GEMINI_MODEL.
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

export function geminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    "";
  return key || null;
}

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Rate-limit / overload answers worth one or two quick retries. */
const RETRYABLE = new Set([429, 500, 503]);

export async function geminiGenerateJson<T>(input: {
  system: string;
  user: string;
  model?: string;
  /** Abort the request after this long (default 60s). */
  timeoutMs?: number;
}): Promise<T> {
  const key = geminiApiKey();
  if (!key) {
    throw new GeminiError(
      "GEMINI_API_KEY is not configured. Add it to the server environment.",
    );
  }

  const model = input.model ?? (process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: input.system }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: input.user }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  let response: Response | null = null;
  let payload: GeminiGenerateResponse = {};
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1500 * 2 ** (attempt - 1));
    response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(input.timeoutMs ?? 60_000),
      headers: { "Content-Type": "application/json" },
      body,
    });
    payload = (await response.json().catch(() => ({}))) as GeminiGenerateResponse;
    if (!RETRYABLE.has(response.status)) break;
  }
  if (!response!.ok) {
    throw new GeminiError(
      `${payload.error?.message ?? "Gemini request failed. Try again or paste manually."} (HTTP ${response!.status}${
        payload.error?.status ? ` ${payload.error.status}` : ""
      })`,
    );
  }

  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    const why = payload.promptFeedback?.blockReason ?? candidate?.finishReason;
    throw new GeminiError(`Gemini returned an empty response${why ? ` (${why})` : ""}.`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const fenced = text.match(/\{[\s\S]*\}/);
    if (fenced) {
      try {
        return JSON.parse(fenced[0]) as T;
      } catch {
        // fall through to the error below
      }
    }
    throw new GeminiError(
      `Gemini returned invalid JSON${candidate?.finishReason && candidate.finishReason !== "STOP" ? ` (${candidate.finishReason})` : ""}. Try again.`,
    );
  }
}
