import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { ExploreScreen } from "@/components/relationship/ExploreScreen";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";
import { ensureStageAtLeast } from "@/lib/relationship/persistence";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function ExplorePage({
  params,
}: PageProps<"/conversations/[connectionId]/explore">) {
  const { connectionId } = await params;
  const { supabase, user, userRow } = await requireAppUser();

  const ctx = await loadRelationshipPageContext(
    supabase,
    connectionId,
    user,
    userRow.user_type,
  );

  // Visiting Explore is itself the "beginning to explore" signal.
  try {
    await ensureStageAtLeast(
      supabase,
      ctx.connection.id,
      "exploring",
      ctx.timeline,
      user.id,
    );
  } catch {
    // relationship_events not migrated yet — non critical, skip silently.
  }

  return (
    <>
      <DashboardHeading>Conversations</DashboardHeading>
      <div className="mb-5">
        <RelationshipTabs connectionId={ctx.connection.id} />
      </div>
      <ExploreScreen
        connectionId={ctx.connection.id}
        otherUserId={ctx.otherUserId}
        otherName={ctx.otherDisplay.name}
        viewerType={ctx.userType}
      />
    </>
  );
}
