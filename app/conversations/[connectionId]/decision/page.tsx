import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs";
import { DecisionScreen } from "@/components/relationship/DecisionScreen";
import { loadRelationshipPageContext } from "@/lib/relationship/pageContext";

export default async function DecisionPage({
  params,
}: PageProps<"/conversations/[connectionId]/decision">) {
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
      <DecisionScreen
        connectionId={ctx.connection.id}
        viewerId={user.id}
        otherName={ctx.otherDisplay.name}
        initialTimeline={ctx.timeline}
      />
    </DashboardShell>
  );
}
