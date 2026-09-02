import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export default async function ConversationsListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow) redirect("/auth");

  const acceptedConnections = await loadAcceptedConnections(supabase, user.id);
  const otherIds = acceptedConnections.map((row) =>
    row.requester_id === user.id ? row.recipient_id : row.requester_id,
  );
  const info = await loadDisplayInfoForUsers(supabase, otherIds);

  const connectionIds = acceptedConnections.map((row) => row.id);
  const { data: conversations } =
    connectionIds.length > 0
      ? await supabase
          .from("conversations")
          .select("id, connection_id")
          .in("connection_id", connectionIds)
      : { data: [] as { id: string; connection_id: string }[] };

  const conversationIds = (conversations ?? []).map((row) => row.id);
  const { data: allMessages } =
    conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : { data: [] as { conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }[] };

  const conversationByConnection = new Map(
    (conversations ?? []).map((row) => [row.connection_id, row.id]),
  );

  const rows = acceptedConnections
    .map((connection) => {
      const otherId =
        connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;
      const display = info.get(otherId);
      if (!display) return null;
      const conversationId = conversationByConnection.get(connection.id);
      const conversationMessages = (allMessages ?? []).filter(
        (m) => m.conversation_id === conversationId,
      );
      const lastMessage = conversationMessages[0] ?? null;
      const unreadCount = conversationMessages.filter(
        (m) => m.sender_id !== user.id && !m.read_at,
      ).length;
      return {
        connectionId: connection.id,
        userId: otherId,
        name: display.name,
        subtitle: display.subtitle,
        initial: display.initial,
        preview: lastMessage ? lastMessage.body : "Say hello",
        timestamp: lastMessage ? timeAgo(lastMessage.created_at) : timeAgo(connection.updated_at),
        unreadCount,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const initials = accountLabel.slice(0, 2).toUpperCase();

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Conversations"
      searchPlaceholder={
        userRow.user_type === "company" ? "Search candidates or roles" : "Search companies"
      }
      userName={accountLabel}
      userInitials={initials}
      userSubtitle={userRow.user_type === "company" ? "Recruiter" : "Talent"}
    >
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        {rows.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            body="Once you and someone else connect, you can start a conversation here."
            actionHref="/discover"
            actionLabel="Find someone to talk to"
          />
        ) : (
          <>
            <h2 className="font-display text-sm font-semibold text-mingle-white">
              Conversations
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {rows.map((row) => (
                <Link
                  key={row.connectionId}
                  href={`/conversations/${row.connectionId}`}
                  className="flex items-center gap-3 rounded-xl border border-mingle-border bg-mingle-bg p-4 transition-colors hover:border-mingle-purple/50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-sm font-bold text-white">
                    {row.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-display text-sm font-semibold text-mingle-white">
                        {row.name}
                      </p>
                      <span className="shrink-0 text-xs text-mingle-text-secondary">
                        {row.timestamp}
                      </span>
                    </div>
                    <p
                      className={`truncate text-xs ${
                        row.unreadCount > 0
                          ? "font-semibold text-mingle-white"
                          : "text-mingle-text-secondary"
                      }`}
                    >
                      {row.preview}
                    </p>
                  </div>
                  {row.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-mingle-cta px-1.5 text-[11px] font-semibold text-white">
                      {row.unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
