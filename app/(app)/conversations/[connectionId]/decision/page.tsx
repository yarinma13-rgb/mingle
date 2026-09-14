import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { DecisionScreen } from "@/components/relationship/DecisionScreen";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function DecisionPage({
  params,
}: PageProps<"/conversations/[connectionId]/decision">) {
  const { connectionId } = await params;
  const { supabase, user, userRow } = await requireAppUser();

  const ctx = await loadRelationshipPageContext(
    supabase,
    connectionId,
    user,
    userRow.user_type,
  );

  return (
    <>
      <DashboardHeading>Conversations</DashboardHeading>
      <div className="mb-5">
        <RelationshipTabs connectionId={ctx.connection.id} />
      </div>
      <DecisionScreen
        connectionId={ctx.connection.id}
        viewerId={user.id}
        otherName={ctx.otherDisplay.name}
        initialTimeline={ctx.timeline}
      />
    </>
  );
}
