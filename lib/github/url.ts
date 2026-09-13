export function normalizeGithubUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (!/^(www\.)?github\.com$/i.test(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 1) return null;
  const login = parts[0];
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(login)) {
    return null;
  }
  // Reject reserved paths that are not user profiles.
  const reserved = new Set([
    "settings",
    "marketplace",
    "orgs",
    "organizations",
    "login",
    "join",
    "features",
    "pricing",
    "about",
    "explore",
    "topics",
    "collections",
    "events",
    "sponsors",
    "notifications",
  ]);
  if (reserved.has(login.toLowerCase())) return null;
  return `https://github.com/${login}`;
}

export function githubLoginFromUrl(url: string): string | null {
  const normalized = normalizeGithubUrl(url);
  if (!normalized) return null;
  return new URL(normalized).pathname.split("/").filter(Boolean)[0] ?? null;
}
