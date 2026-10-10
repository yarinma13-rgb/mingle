/**
 * Thin Gemini REST client. Uses GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY).
 * No SDK dependency — fetch only, following other server env patterns in the repo.
 */

const DEFAULT_MODEL = "gemini-2.0-flash";

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
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export async function geminiGenerateJson<T>(input: {
  system: string;
  user: string;
  model?: string;
}): Promise<T> {
  const key = geminiApiKey();
  if (!key) {
    throw new GeminiError(
      "GEMINI_API_KEY is not configured. Add it to the server environment.",
    );
  }

  const model = input.model ?? DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });

  const payload = (await response.json()) as GeminiGenerateResponse;
  if (!response.ok) {
    throw new GeminiError(
      payload.error?.message ??
        `Gemini request failed (${response.status}). Try again or paste manually.`,
    );
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new GeminiError("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const fenced = text.match(/\{[\s\S]*\}/);
    if (fenced) {
      return JSON.parse(fenced[0]) as T;
    }
    throw new GeminiError("Gemini returned invalid JSON. Try again.");
  }
}
