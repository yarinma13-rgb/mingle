"use server";

import { createClient } from "@/lib/supabase/server";
import {
  describeGithubSignal,
  fetchGithubPublicMeta,
  type GithubPublicMeta,
} from "@/lib/github/meta";
import {
  githubLoginFromUrl,
  normalizeGithubUrl,
} from "@/lib/github/url";

function githubColumnsMissing(message: string) {
  return /github_url|github_login|github_meta|github_fetched_at|schema cache|column/i.test(
    message,
  );
}

export async function saveTalentGithubUrlAction(rawUrl: string): Promise<
  | { ok: true; githubUrl: string | null; githubLogin: string | null; signal: string | null }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to update your profile." };

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    const { error } = await supabase
      .from("talent_profiles")
      .update({
        github_url: null,
        github_login: null,
        github_meta: null,
        github_fetched_at: null,
      })
      .eq("user_id", user.id);
    if (error && !githubColumnsMissing(error.message)) {
      return { ok: false, error: "Couldn't clear GitHub link." };
    }
    if (error && githubColumnsMissing(error.message)) {
      return {
        ok: false,
        error:
          "GitHub field is not live yet. Ask the founder to run migration 0030.",
      };
    }
    return { ok: true, githubUrl: null, githubLogin: null, signal: null };
  }

  const githubUrl = normalizeGithubUrl(trimmed);
  const login = githubUrl ? githubLoginFromUrl(githubUrl) : null;
  if (!githubUrl || !login) {
    return {
      ok: false,
      error: "Use a public GitHub profile URL like https://github.com/username.",
    };
  }

  let meta: GithubPublicMeta | null = null;
  try {
    meta = await fetchGithubPublicMeta(login);
  } catch {
    meta = null;
  }

  const { error } = await supabase
    .from("talent_profiles")
    .update({
      github_url: githubUrl,
      github_login: meta?.login ?? login,
      github_meta: (meta ?? null) as Record<string, unknown> | null,
      github_fetched_at: meta ? new Date().toISOString() : null,
    })
    .eq("user_id", user.id);
  if (error) {
    if (githubColumnsMissing(error.message)) {
      return {
        ok: false,
        error:
          "GitHub field is not live yet. Ask the founder to run migration 0030.",
      };
    }
    return { ok: false, error: "Couldn't save GitHub link." };
  }

  return {
    ok: true,
    githubUrl,
    githubLogin: meta?.login ?? login,
    signal: describeGithubSignal(meta) ?? `GitHub @${login}`,
  };
}
