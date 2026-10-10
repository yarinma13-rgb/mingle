import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { loadIncomingPending, loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";

export type NotificationItem =
  | {
      kind: "connection_request";
      id: string;
      userId: string;
      name: string;
      createdAt: string;
    }
  | {
      kind: "message";
      id: string;
      connectionId: string;
      userId: string;
      name: string;
      preview: string;
      createdAt: string;
    }
  | {
      kind: "talent_exchange_interest";
      id: string;
      matchId: string;
      companyName: string;
      roleTitle: string | null;
      createdAt: string;
    };

// Deliberately derived live from connections/messages rather than a
// separate notifications table — see supabase/migrations/0008 — so
// there is nothing to keep in sync and nothing that can go stale.
export async function loadNotificationSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<NotificationItem[]> {
  const [pendingConnections, acceptedConnections] = await Promise.all([
    loadIncomingPending(supabase, userId),
    loadAcceptedConnections(supabase, userId),
  ]);

  const connectionItems: NotificationItem[] = [];
  const otherIds = new Set<string>();
  pendingConnections.forEach((row) => otherIds.add(row.requester_id));

  const acceptedIds = acceptedConnections.map((row) => row.id);
  let unreadItems: NotificationItem[] = [];

  if (acceptedIds.length > 0) {
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, connection_id")
      .in("connection_id", acceptedIds);

    const conversationIds = (conversations ?? []).map((row) => row.id);
    const connectionByConversation = new Map(
      (conversations ?? []).map((row) => [row.id, row.connection_id]),
    );
    const connectionById = new Map(acceptedConnections.map((row) => [row.id, row]));

    if (conversationIds.length > 0) {
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId)
        .is("read_at", null)
        .order("created_at", { ascending: false });

      for (const message of unreadMessages ?? []) {
        const connectionId = connectionByConversation.get(message.conversation_id);
        const connection = connectionId ? connectionById.get(connectionId) : null;
        if (!connection) continue;
        const otherId =
          connection.requester_id === userId ? connection.recipient_id : connection.requester_id;
        otherIds.add(otherId);
        unreadItems.push({
          kind: "message",
          id: message.id,
          connectionId: connection.id,
          userId: otherId,
          name: "",
          preview: message.body,
          createdAt: message.created_at,
        });
      }
    }
  }

  const info = await loadDisplayInfoForUsers(supabase, [...otherIds]);

  for (const row of pendingConnections) {
    const display = info.get(row.requester_id);
    if (!display) continue;
    connectionItems.push({
      kind: "connection_request",
      id: row.id,
      userId: row.requester_id,
      name: display.name,
      createdAt: row.created_at,
    });
  }

  unreadItems = unreadItems
    .map((item) => {
      if (item.kind !== "message") return item;
      const display = info.get(item.userId);
      return display ? { ...item, name: display.name } : null;
    })
    .filter((item): item is NotificationItem => item !== null);

  const talentExchangeItems = await loadPendingTalentExchangeNotifications(supabase, userId);

  return [...connectionItems, ...unreadItems, ...talentExchangeItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Companies that have expressed interest in this candidate via the
 * post-rejection talent exchange, not yet responded to. Company identity
 * is shown here deliberately — only the CANDIDATE stays anonymous to the
 * company before mutual interest, not the other way around (the company
 * already identified itself by expressing interest).
 */
async function loadPendingTalentExchangeNotifications(
  supabase: SupabaseClient<Database>,
  candidateId: string,
): Promise<NotificationItem[]> {
  const { data: matchRows } = await supabase
    .from("matches")
    .select("id, company_id, role_id")
    .eq("candidate_id", candidateId);
  if (!matchRows || matchRows.length === 0) return [];

  const matchById = new Map(matchRows.map((row) => [row.id, row]));
  const { data: interestRows } = await supabase
    .from("talent_exchange_interest")
    .select("match_id, created_at")
    .in("match_id", matchRows.map((row) => row.id))
    .eq("company_interested", true)
    .is("candidate_interested", null);
  if (!interestRows || interestRows.length === 0) return [];

  const companyIds = [
    ...new Set(
      interestRows
        .map((row) => matchById.get(row.match_id)?.company_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const roleIds = [
    ...new Set(
      interestRows
        .map((row) => matchById.get(row.match_id)?.role_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [companyInfo, { data: roleRows }] = await Promise.all([
    loadDisplayInfoForUsers(supabase, companyIds),
    roleIds.length > 0
      ? supabase.from("roles").select("id, title").in("id", roleIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const roleTitleById = new Map((roleRows ?? []).map((row) => [row.id, row.title]));

  return interestRows
    .map((row): NotificationItem | null => {
      const match = matchById.get(row.match_id);
      if (!match) return null;
      const companyName = companyInfo.get(match.company_id)?.name;
      if (!companyName) return null;
      return {
        kind: "talent_exchange_interest",
        id: row.match_id,
        matchId: row.match_id,
        companyName,
        roleTitle: match.role_id ? roleTitleById.get(match.role_id) ?? null : null,
        createdAt: row.created_at,
      };
    })
    .filter((item): item is NotificationItem => item !== null);
}
