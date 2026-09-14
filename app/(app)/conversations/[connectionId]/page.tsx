import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { ConversationScreen } from "@/components/messaging/ConversationScreen";
import { RelationshipContextPanel } from "@/components/messaging/RelationshipContextPanel";
import { MessagingUnavailable } from "@/components/messaging/MessagingUnavailable";
import { classifyMessagingError } from "@/lib/messaging/errors";
import { getOrCreateConversation, loadMessages } from "@/lib/messaging/persistence";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";
import { loadTimeline, ensureInConversationEvent, latestStage } from "@/lib/relationship/persistence";
import { loadUpcomingInterviewForConnection } from "@/lib/interviews/persistence";
import { loadPendingProposalForConnection } from "@/lib/interviews/proposals";
import { loadCalendarConnection } from "@/lib/calendar/persistence";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function ConversationPage({
  params,
}: PageProps<"/conversations/[connectionId]">) {
  const { connectionId } = await params;
  const { supabase, user, userRow } = await requireAppUser();

  const ctx = await loadRelationshipPageContext(
    supabase,
    connectionId,
    user,
    userRow.user_type,
  );

  if (ctx.connection.status !== "accepted") {
    return (
      <>
        <DashboardHeading compact>Conversations</DashboardHeading>
        <MessagingUnavailable connectionId={connectionId} kind="not_accepted" />
      </>
    );
  }

  let conversation;
  let messages;
  let messagingError: unknown = null;
  try {
    conversation = await getOrCreateConversation(supabase, ctx.connection.id);
    messages = await loadMessages(supabase, conversation.id);
  } catch (error) {
    messagingError = error;
  }

  if (messagingError || !conversation || !messages) {
    return (
      <>
        <DashboardHeading compact>Conversations</DashboardHeading>
        <MessagingUnavailable
          connectionId={connectionId}
          kind={classifyMessagingError(messagingError ?? new Error("unknown"))}
        />
      </>
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
  const stage = latestStage(timeline);

  const whyConnected = ctx.alignedFactors[0]?.detail ?? "You connected on mingle.";
  const [upcomingInterview, pendingProposal, calendarConnection] =
    await Promise.all([
      loadUpcomingInterviewForConnection(supabase, ctx.connection.id),
      loadPendingProposalForConnection(supabase, ctx.connection.id),
      ctx.userType === "company"
        ? loadCalendarConnection(supabase, user.id)
        : Promise.resolve(null),
    ]);
  const canScheduleInterview =
    ctx.userType === "company" && ctx.connection.status === "accepted";

  return (
    <>
      <DashboardHeading compact>Conversations</DashboardHeading>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="shrink-0">
          <RelationshipTabs connectionId={ctx.connection.id} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
          <div className="min-h-0 min-w-0 flex-1">
            <ConversationScreen
              conversationId={conversation.id}
              viewerId={user.id}
              otherUserId={ctx.otherUserId}
              otherName={ctx.otherDisplay.name}
              otherSubtitle={ctx.otherDisplay.subtitle}
              otherInitial={ctx.otherDisplay.initial}
              otherPhoto={ctx.otherDisplay.photo}
              otherGender={ctx.otherDisplay.gender}
              whyConnected={whyConnected}
              initialMessages={messages}
              connectionId={ctx.connection.id}
              canScheduleInterview={canScheduleInterview}
              companyId={user.id}
              upcomingInterview={upcomingInterview}
              pendingProposal={pendingProposal}
              calendarConnected={Boolean(calendarConnection)}
            />
          </div>
          <div className="min-h-0 lg:w-80 lg:shrink-0 lg:overflow-y-auto">
            <RelationshipContextPanel
              connectionId={ctx.connection.id}
              score={ctx.matchScore}
              alignedFactors={ctx.alignedFactors}
              exploreFactors={ctx.exploreFactors}
              stage={stage}
              timeline={timeline}
            />
          </div>
        </div>
      </div>
    </>
  );
}
