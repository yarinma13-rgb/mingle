import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RelationshipStage } from "@/lib/supabase/types";
import { loadMatchFeedbackMap } from "@/lib/matching/feedback";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import {
  latestStage,
  loadTimelinesForConnections,
} from "@/lib/relationship/persistence";
import { loadDiscoveryPage } from "@/lib/discovery/query";
import type { DiscoveryFilters } from "@/lib/discovery/filters";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { notifyPushToUser } from "@/lib/push/actions";

export type RediscoverySignal =
  | "interested"
  | "mutual"
  | "in_conversation";

export type RediscoveryRow = {
  candidateId: string;
  priorSignal: RediscoverySignal;
  priorRoleId: string | null;
  priorRoleTitle: string | null;
  priorAt: string | null;
  score: number | null;
};

export type RediscoveryBadge = {
  priorSignal: RediscoverySignal;
  priorRoleTitle: string | null;
  priorAt: string | null;
  score: number | null;
};

const EMPTY_FILTERS: DiscoveryFilters = {
  industry: "",
  location: "",
  style: "",
  role: "",
  workModel: "",
  yearsMin: null,
  yearsMax: null,
  distanceKm: null,
  values: [],
  page: 1,
};

const SIGNAL_RANK: Record<RediscoverySignal, number> = {
  interested: 1,
  mutual: 2,
  in_conversation: 3,
};

const CONVERSATION_OR_BEYOND: RelationshipStage[] = [
  "in_conversation",
  "opportunity",
  "decision",
  "relationship",
];

function isMissingRediscoveryTable(message: string | undefined): boolean {
  return /rediscovered_matches|schema cache|column/i.test(message ?? "");
}

function otherParty(
  companyId: string,
  requesterId: string,
  recipientId: string,
): string {
  return requesterId === companyId ? recipientId : requesterId;
}

/**
 * Warm pool for rediscovery:
 * - company marked Interested
 * - accepted (mutual) connection
 * - relationship stage in_conversation or further
 * Explicit not_fit for this company is always excluded.
 */
export async function collectRediscoveryPool(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<Map<string, { signal: RediscoverySignal; at: string | null }>> {
  const pool = new Map<string, { signal: RediscoverySignal; at: string | null }>();

  const feedback = await loadMatchFeedbackMap(supabase, companyId);
  const notFit = new Set(
    Object.entries(feedback)
      .filter(([, action]) => action === "not_fit")
      .map(([id]) => id),
  );

  for (const [candidateId, action] of Object.entries(feedback)) {
    if (action !== "interested") continue;
    if (notFit.has(candidateId)) continue;
    pool.set(candidateId, { signal: "interested", at: null });
  }

  const accepted = await loadAcceptedConnections(supabase, companyId);
  const timelines = await loadTimelinesForConnections(
    supabase,
    accepted.map((row) => row.id),
  );

  for (const row of accepted) {
    const candidateId = otherParty(
      companyId,
      row.requester_id,
      row.recipient_id,
    );
    if (notFit.has(candidateId)) continue;
    const stage = latestStage(timelines.get(row.id) ?? []);
    const signal: RediscoverySignal = CONVERSATION_OR_BEYOND.includes(stage)
      ? "in_conversation"
      : "mutual";
    const existing = pool.get(candidateId);
    if (!existing || SIGNAL_RANK[signal] >= SIGNAL_RANK[existing.signal]) {
      pool.set(candidateId, {
        signal,
        at: row.updated_at ?? row.created_at ?? null,
      });
    }
  }

  return pool;
}

async function loadPriorRoleContext(
  supabase: SupabaseClient<Database>,
  companyId: string,
  candidateIds: string[],
  newRoleId: string,
): Promise<
  Map<string, { roleId: string | null; title: string | null; at: string | null }>
> {
  const map = new Map<
    string,
    { roleId: string | null; title: string | null; at: string | null }
  >();
  if (candidateIds.length === 0) return map;

  const { data, error } = await supabase
    .from("match_reviews")
    .select("candidate_id, role_id, job_title, created_at")
    .eq("company_id", companyId)
    .in("candidate_id", candidateIds)
    .neq("role_id", newRoleId)
    .order("created_at", { ascending: false });
  if (!error && data) {
    for (const row of data) {
      if (map.has(row.candidate_id)) continue;
      map.set(row.candidate_id, {
        roleId: row.role_id,
        title: row.job_title,
        at: row.created_at,
      });
    }
  }

  const missing = candidateIds.filter((id) => !map.has(id));
  if (missing.length === 0) return map;

  const { data: roles } = await supabase
    .from("roles")
    .select("id, title, created_at")
    .eq("company_id", companyId)
    .neq("id", newRoleId)
    .order("created_at", { ascending: false })
    .limit(1);
  const prior = roles?.[0];
  if (!prior) return map;
  for (const candidateId of missing) {
    map.set(candidateId, {
      roleId: prior.id,
      title: prior.title,
      at: prior.created_at,
    });
  }
  return map;
}

/**
 * Idempotent: builds rediscovery rows for a newly opened role,
 * scores them with the existing match engine, stores badges, notifies talent once.
 */
export async function ensureRediscoveryForRole(
  supabase: SupabaseClient<Database>,
  input: {
    companyId: string;
    roleId: string;
    roleTitle: string;
    notify?: boolean;
  },
): Promise<RediscoveryRow[]> {
  const { companyId, roleId, roleTitle } = input;
  const notify = input.notify !== false;

  const { data: existing, error: existingError } = await supabase
    .from("rediscovered_matches")
    .select(
      "candidate_id, prior_signal, prior_role_id, prior_role_title, prior_at, score, notified_at",
    )
    .eq("role_id", roleId);
  if (existingError) {
    if (isMissingRediscoveryTable(existingError.message)) return [];
    return [];
  }
  if (existing && existing.length > 0) {
    if (notify) {
      await notifyPendingRediscoveries(
        companyId,
        roleId,
        roleTitle,
        existing,
        supabase,
      );
    }
    return existing.map((row) => ({
      candidateId: row.candidate_id,
      priorSignal: row.prior_signal,
      priorRoleId: row.prior_role_id,
      priorRoleTitle: row.prior_role_title,
      priorAt: row.prior_at,
      score: row.score,
    }));
  }

  const pool = await collectRediscoveryPool(supabase, companyId);
  if (pool.size === 0) return [];

  const candidateIds = [...pool.keys()];
  const priorContext = await loadPriorRoleContext(
    supabase,
    companyId,
    candidateIds,
    roleId,
  );

  const ranked = await loadDiscoveryPage(
    supabase,
    { id: companyId, userType: "company" },
    EMPTY_FILTERS,
    [],
    { onlyUserIds: candidateIds, rankAll: true },
  );
  const scoreById = new Map(
    ranked.cards.map((card) => [card.userId, Math.round(card.score)]),
  );

  const rows = candidateIds.map((candidateId) => {
    const entry = pool.get(candidateId)!;
    const prior = priorContext.get(candidateId);
    return {
      role_id: roleId,
      company_id: companyId,
      candidate_id: candidateId,
      prior_signal: entry.signal,
      prior_role_id: prior?.roleId ?? null,
      prior_role_title: prior?.title ?? null,
      prior_at: prior?.at ?? entry.at,
      score: scoreById.get(candidateId) ?? null,
    };
  });

  const { error: upsertError } = await supabase
    .from("rediscovered_matches")
    .upsert(rows, { onConflict: "role_id,candidate_id" });
  if (upsertError) {
    if (isMissingRediscoveryTable(upsertError.message)) return [];
    console.error("ensureRediscoveryForRole", upsertError.message);
    return [];
  }

  for (const row of rows) {
    track(
      AnalyticsEvent.candidateRediscovered,
      {
        role_id: roleId,
        candidate_id: row.candidate_id,
        prior_signal: row.prior_signal,
        score: row.score,
      },
      companyId,
    );
  }

  if (notify) {
    const { data: stored } = await supabase
      .from("rediscovered_matches")
      .select(
        "candidate_id, prior_signal, prior_role_id, prior_role_title, prior_at, score, notified_at",
      )
      .eq("role_id", roleId);
    await notifyPendingRediscoveries(
      companyId,
      roleId,
      roleTitle,
      stored ?? [],
      supabase,
    );
  }

  return rows.map((row) => ({
    candidateId: row.candidate_id,
    priorSignal: row.prior_signal,
    priorRoleId: row.prior_role_id,
    priorRoleTitle: row.prior_role_title,
    priorAt: row.prior_at,
    score: row.score,
  }));
}

async function notifyPendingRediscoveries(
  companyId: string,
  roleId: string,
  roleTitle: string,
  rows: Array<{ candidate_id: string; notified_at: string | null }>,
  supabase: SupabaseClient<Database>,
) {
  const pending = rows.filter((row) => !row.notified_at);
  if (pending.length === 0) return;

  const { data: companyRow } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("user_id", companyId)
    .maybeSingle();
  const companyName = companyRow?.company_name?.trim() || "A company on mingle";

  for (const row of pending) {
    try {
      await notifyPushToUser(row.candidate_id, {
        title: "mingle",
        body: `${companyName} opened “${roleTitle}” — you may be a fit again.`,
        url: "/discover",
      });
    } catch {
      // Push is best-effort.
    }
  }

  await supabase
    .from("rediscovered_matches")
    .update({ notified_at: new Date().toISOString() })
    .eq("role_id", roleId)
    .is("notified_at", null);
}

export async function loadRediscoveryBadgeMap(
  supabase: SupabaseClient<Database>,
  roleId: string,
): Promise<Record<string, RediscoveryBadge>> {
  const { data, error } = await supabase
    .from("rediscovered_matches")
    .select("candidate_id, prior_signal, prior_role_title, prior_at, score")
    .eq("role_id", roleId);
  if (error || !data) return {};
  const map: Record<string, RediscoveryBadge> = {};
  for (const row of data) {
    map[row.candidate_id] = {
      priorSignal: row.prior_signal,
      priorRoleTitle: row.prior_role_title,
      priorAt: row.prior_at,
      score: row.score,
    };
  }
  return map;
}

export async function loadOpenRoleRediscoveryByCandidate(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<Record<string, RediscoveryBadge & { roleTitle: string }>> {
  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("id, title")
    .eq("company_id", companyId)
    .eq("status", "open");
  if (rolesError || !roles?.length) return {};

  const roleTitleById = new Map(roles.map((role) => [role.id, role.title]));
  const { data, error } = await supabase
    .from("rediscovered_matches")
    .select(
      "candidate_id, role_id, prior_signal, prior_role_title, prior_at, score",
    )
    .eq("company_id", companyId)
    .in(
      "role_id",
      roles.map((role) => role.id),
    );
  if (error || !data) return {};

  const map: Record<string, RediscoveryBadge & { roleTitle: string }> = {};
  for (const row of data) {
    const next = {
      priorSignal: row.prior_signal as RediscoverySignal,
      priorRoleTitle: row.prior_role_title,
      priorAt: row.prior_at,
      score: row.score,
      roleTitle: roleTitleById.get(row.role_id) ?? "new role",
    };
    const existing = map[row.candidate_id];
    if (
      !existing ||
      SIGNAL_RANK[next.priorSignal] >= SIGNAL_RANK[existing.priorSignal]
    ) {
      map[row.candidate_id] = next;
    }
  }
  return map;
}

export function formatRediscoveryLabel(badge: {
  priorRoleTitle: string | null;
  priorAt: string | null;
}): string {
  const when = badge.priorAt
    ? new Date(badge.priorAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;
  if (badge.priorRoleTitle && when) {
    return `Rediscovered · fit ${badge.priorRoleTitle} (${when})`;
  }
  if (badge.priorRoleTitle) {
    return `Rediscovered · previously fit ${badge.priorRoleTitle}`;
  }
  return "Rediscovered match";
}
