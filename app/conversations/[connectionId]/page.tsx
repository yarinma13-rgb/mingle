import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { ConversationScreen } from "@/components/messaging/ConversationScreen";
import { RelationshipContextPanel } from "@/components/messaging/RelationshipContextPanel";
import { getOrCreateConversation, loadMessages } from "@/lib/messaging/persistence";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";
import { loadTimeline, ensureInConversationEvent, currentStage } from "@/lib/relationship/persistence";

export default async function ConversationPage({
  params,
}: PageProps<"/conversations/[connectionId]">) {
  const { connectionId } = await params;
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

  const ctx = await loadRelationshipPageContext(supabase, connectionId, user, userRow.user_type);

  let conversation;
  let messages;
  try {
    conversation = await getOrCreateConversation(supabase, ctx.connection.id);
    messages = await loadMessages(supabase, conversation.id);
  } catch {
    return (
      <DashboardShell
        userType={ctx.userType}
        userId={user.id}
        title="Conversations"
        searchPlaceholder={
          ctx.userType === "company" ? "Search candidates or roles" : "Search companies"
        }
        userName={ctx.accountLabel}
        userInitials={ctx.initials}
        userSubtitle={ctx.userType === "company" ? "Recruiter" : "Talent"}
      >
        <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-10 text-center">
          <p className="text-sm text-mingle-text-secondary">
            Messaging isn&rsquo;t set up yet. Try again in a moment.
          </p>
        </div>
      </DashboardShell>
    );
  }

  let timeline = ctx.timeline;
  try {
    const advanced = await ensureInConversationEvent(
      supabase,
      ctx.connection.id,
      ctx.timeline,
      messages,
      ctx.connection.requester_id,
      ctx.connection.recipient_id,
    );
    if (advanced) timeline = await loadTimeline(supabase, ctx.connection.id);
  } catch {
    // relationship_events not migrated yet — panel just shows whatever
    // ctx already loaded (gracefully degraded to "connected" there).
  }
  const stage = currentStage(timeline);

  const whyConnected = ctx.alignedFactors[0]?.detail ?? "You connected on mingle.";

  return (
    <DashboardShell
      userType={ctx.userType}
      userId={user.id}
      title="Conversations"
      searchPlaceholder={
        ctx.userType === "company" ? "Search candidates or roles" : "Search companies"
      }
      userName={ctx.accountLabel}
      userInitials={ctx.initials}
      userSubtitle={ctx.userType === "company" ? "Recruiter" : "Talent"}
    >
      <div className="mb-5">
        <RelationshipTabs connectionId={ctx.connection.id} />
      </div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <ConversationScreen
            conversationId={conversation.id}
            viewerId={user.id}
            otherUserId={ctx.otherUserId}
            otherName={ctx.otherDisplay.name}
            otherSubtitle={ctx.otherDisplay.subtitle}
            otherInitial={ctx.otherDisplay.initial}
            whyConnected={whyConnected}
            initialMessages={messages}
          />
        </div>
        <RelationshipContextPanel
          score={ctx.matchScore}
          alignedFactors={ctx.alignedFactors}
          exploreFactors={ctx.exploreFactors}
          stage={stage}
          timeline={timeline}
        />
      </div>
    </DashboardShell>
  );
}
