import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { ExploreScreen } from "@/components/relationship/ExploreScreen";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";
import { ensureStageAtLeast } from "@/lib/relationship/persistence";

export default async function ExplorePage({
  params,
}: PageProps<"/conversations/[connectionId]/explore">) {
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

  // Visiting Explore is itself the "beginning to explore" signal.
  try {
    await ensureStageAtLeast(supabase, ctx.connection.id, "exploring", ctx.timeline, user.id);
  } catch {
    // relationship_events not migrated yet — non critical, skip silently.
  }

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
      <ExploreScreen
        connectionId={ctx.connection.id}
        otherUserId={ctx.otherUserId}
        otherName={ctx.otherDisplay.name}
        viewerType={ctx.userType}
      />
    </DashboardShell>
  );
}
