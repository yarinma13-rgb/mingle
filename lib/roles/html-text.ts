/** Lightweight HTML helpers for job-board JD import (no DOM dependency). */

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&([a-z]+);/gi, (full, name: string) => {
      return ENTITY_MAP[name.toLowerCase()] ?? full;
    });
}

export function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
      .replace(/<(p|div|li|h[1-6]|tr|section|article)(\s[^>]*)?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\u00a0/g, " "),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function metaContent(html: string, nameOrProperty: string): string {
  const escaped = nameOrProperty.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]).trim();
  }
  return "";
}

export function documentTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : "";
}

export function firstHeading(html: string): string {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : "";
}

export function elementById(html: string, id: string): string {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const open = new RegExp(
    `<([a-z0-9]+)([^>]*\\sid=["']${escaped}["'][^>]*)>`,
    "i",
  );
  const match = open.exec(html);
  if (!match || match.index == null) return "";
  const tag = match[1].toLowerCase();
  const start = match.index + match[0].length;
  const lower = html.toLowerCase();
  let depth = 1;
  let i = start;
  const openTag = new RegExp(`<${tag}(\\s[^>]*)?>`, "gi");
  const closeTag = new RegExp(`</${tag}>`, "gi");
  while (i < html.length && depth > 0) {
    openTag.lastIndex = i;
    closeTag.lastIndex = i;
    const nextOpen = openTag.exec(lower);
    const nextClose = closeTag.exec(lower);
    if (!nextClose) break;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      i = nextOpen.index + nextOpen[0].length;
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return html.slice(start, nextClose.index);
    }
    i = nextClose.index + nextClose[0].length;
  }
  return "";
}

export function firstMatchHtml(
  html: string,
  pattern: RegExp,
): string {
  const match = html.match(pattern);
  return match?.[1] ? match[1] : "";
}

export function extractJsonLdJobPosting(html: string): {
  title?: string;
  description?: string;
} | null {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const block of blocks) {
    const raw = block[1]?.trim();
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const record = node as Record<string, unknown>;
        const type = record["@type"];
        const isJob =
          type === "JobPosting" ||
          (Array.isArray(type) && type.includes("JobPosting"));
        if (!isJob) continue;
        const title =
          typeof record.title === "string" ? record.title.trim() : "";
        const description =
          typeof record.description === "string"
            ? stripTags(record.description)
            : "";
        if (title || description) {
          return {
            title: title || undefined,
            description: description || undefined,
          };
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null;
}
