import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { OpportunityScreen } from "@/components/relationship/OpportunityScreen";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function OpportunityPage({
  params,
}: PageProps<"/conversations/[connectionId]/opportunity">) {
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
      <OpportunityScreen
        connectionId={ctx.connection.id}
        viewerId={user.id}
        viewerType={ctx.userType}
        otherName={ctx.otherDisplay.name}
        alignedFactors={ctx.alignedFactors}
        initialTimeline={ctx.timeline}
      />
    </>
  );
}
