import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { OpportunityScreen } from "@/components/relationship/OpportunityScreen";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";

export default async function OpportunityPage({
  params,
}: PageProps<"/conversations/[connectionId]/opportunity">) {
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
      <OpportunityScreen
        connectionId={ctx.connection.id}
        viewerId={user.id}
        viewerType={ctx.userType}
        otherName={ctx.otherDisplay.name}
        alignedFactors={ctx.alignedFactors}
        initialTimeline={ctx.timeline}
      />
    </DashboardShell>
  );
}
