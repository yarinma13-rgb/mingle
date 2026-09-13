export type GithubPublicMeta = {
  login: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
  languages: string[];
  topRepos: { name: string; language: string | null; stars: number }[];
  profileUrl: string;
};

export function emptyGithubMeta(login: string): GithubPublicMeta {
  return {
    login,
    name: null,
    bio: null,
    publicRepos: 0,
    followers: 0,
    languages: [],
    topRepos: [],
    profileUrl: `https://github.com/${login}`,
  };
}

export async function fetchGithubPublicMeta(
  login: string,
): Promise<GithubPublicMeta | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mingle-careers",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!userRes.ok) return null;
  const user = (await userRes.json()) as {
    login?: string;
    name?: string | null;
    bio?: string | null;
    public_repos?: number;
    followers?: number;
    html_url?: string;
  };
  if (!user.login) return null;

  const reposRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}/repos?per_page=100&sort=updated`,
    { headers, next: { revalidate: 3600 } },
  );
  const repos = reposRes.ok
    ? ((await reposRes.json()) as Array<{
        name?: string;
        language?: string | null;
        stargazers_count?: number;
        fork?: boolean;
      }>)
    : [];

  const own = repos.filter((repo) => !repo.fork);
  const languageCounts = new Map<string, number>();
  for (const repo of own) {
    const language = repo.language?.trim();
    if (!language) continue;
    languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
  }
  const languages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([language]) => language)
    .slice(0, 8);

  const topRepos = [...own]
    .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
    .slice(0, 3)
    .map((repo) => ({
      name: repo.name ?? "repo",
      language: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
    }));

  return {
    login: user.login,
    name: user.name?.trim() || null,
    bio: user.bio?.trim() || null,
    publicRepos: user.public_repos ?? own.length,
    followers: user.followers ?? 0,
    languages,
    topRepos,
    profileUrl: user.html_url ?? `https://github.com/${user.login}`,
  };
}

export function describeGithubSignal(meta: GithubPublicMeta | null): string | null {
  if (!meta) return null;
  const parts: string[] = [`@${meta.login}`];
  if (meta.languages.length) {
    parts.push(meta.languages.slice(0, 4).join(", "));
  }
  if (meta.publicRepos > 0) {
    parts.push(`${meta.publicRepos} public repos`);
  }
  return parts.join(" · ");
}

export function isGithubPublicMeta(value: unknown): value is GithubPublicMeta {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.login === "string" && Array.isArray(row.languages);
}

export function technicalSignalFinding(
  login: string | null | undefined,
  metaRaw: unknown,
): string | null {
  const meta = isGithubPublicMeta(metaRaw) ? metaRaw : null;
  if (meta) return describeGithubSignal(meta);
  const handle = login?.trim();
  if (!handle) return null;
  return `@${handle} · GitHub linked`;
}
