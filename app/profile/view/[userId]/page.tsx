import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ProfileDetailShell,
  type ProfileDetailSection,
} from "@/components/profile-detail/ProfileDetailShell";
import {
  TALENT_EXPLORE_PROMPTS,
  COMPANY_EXPLORE_PROMPTS,
} from "@/lib/profile-detail/why-match";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { loadConnectionStatusWith } from "@/lib/connections/persistence";
import { loadSavedUserIds } from "@/lib/matching/saved";
import { loadTalentMatchInput, loadCompanyMatchInput } from "@/lib/matching/context";
import { computeMatch } from "@/lib/matching/engine";
import { buildMatchReport, type MatchReport } from "@/lib/matching/report";
import { loadMatchFeedbackAction, type MatchFeedbackAction } from "@/lib/matching/feedback";
import { companyInitials, personInitials } from "@/lib/profile/avatar";
import { CandidateDnaPanel } from "@/components/profile/CandidateDnaPanel";
import { buildCandidateDna } from "@/lib/matching/dna";
import { loadSubmittedRecommendations } from "@/lib/recommendations/persistence";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";

async function loadViewerMatchReport(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  viewerType: UserType,
  targetId: string,
  targetType: UserType,
): Promise<{
  report: MatchReport | null;
  feedback: MatchFeedbackAction | null;
}> {
  if (viewerId === targetId || viewerType === targetType) {
    return { report: null, feedback: null };
  }
  const [talent, company, feedback] = await Promise.all([
    loadTalentMatchInput(
      supabase,
      viewerType === "talent" ? viewerId : targetId,
    ),
    loadCompanyMatchInput(
      supabase,
      viewerType === "company" ? viewerId : targetId,
    ),
    loadMatchFeedbackAction(supabase, viewerId, targetId),
  ]);
  if (!talent || !company) return { report: null, feedback };
  const result = computeMatch(talent, company);
  const audience = viewerType === "talent" ? "talent" : "company";
  return {
    report: buildMatchReport(result, talent, company, audience),
    feedback,
  };
}

export default async function ProfileViewPage({
  params,
}: PageProps<"/profile/view/[userId]">) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) redirect("/auth");

  const { data: targetUser } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", userId)
    .maybeSingle();
  if (!targetUser) notFound();

  const { data: viewerUser } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", viewer.id)
    .maybeSingle();

  const connectionStatus =
    viewer.id === userId
      ? null
      : await loadConnectionStatusWith(supabase, viewer.id, userId);

  const savedIds =
    viewer.id === userId ? [] : await loadSavedUserIds(supabase, viewer.id);
  const initiallySaved = savedIds.includes(userId);
  const matchBundle =
    viewerUser && viewer.id !== userId
      ? await loadViewerMatchReport(
          supabase,
          viewer.id,
          viewerUser.user_type,
          userId,
          targetUser.user_type,
        )
      : { report: null, feedback: null };

  if (targetUser.user_type === "talent") {
    const { data: talentRow } = await supabase
      .from("talent_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!talentRow) notFound();
    const talent = toTalentProfile(talentRow);

    const sections: ProfileDetailSection[] = [
      {
        title: "Professional background",
        text: [
          talent.currentRole,
          talent.yearsExperience !== null
            ? `${talent.yearsExperience} years experience`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      },
      { title: "What drives them", chips: talent.drives },
      { title: "How they work", chips: talent.workStyle },
      { title: "What they're looking for", chips: talent.lookingFor },
      { title: "Skills", chips: talent.skills },
      { title: "Beyond the CV", text: talent.beyondCv },
    ];

    const initials = personInitials(talent.firstName, talent.lastName);
    const recommendations = await loadSubmittedRecommendations(supabase, userId);

    return (
      <main className="flex min-h-screen flex-1 flex-col">
        {viewer.id === userId ? (
          <div className="mx-auto w-full max-w-4xl px-4 pt-10">
            <CandidateDnaPanel dna={buildCandidateDna(talent)} />
          </div>
        ) : null}
        <ProfileDetailShell
          eyebrow="Talent profile"
          photo={talent.profilePhoto}
          initial={initials}
          gender={talent.gender}
          name={`${talent.firstName} ${talent.lastName}`.trim()}
          subtitle={talent.headline}
          meta={[talent.location, talent.industry].filter(Boolean).join(" · ")}
          sections={sections}
          whyMatch={null}
          matchReport={matchBundle.report}
          initialFeedback={matchBundle.feedback}
          whatToExplore={TALENT_EXPLORE_PROMPTS}
          viewerId={viewer.id}
          targetUserId={userId}
          initialConnectionStatus={connectionStatus}
          initiallySaved={initiallySaved}
          cvPath={talent.cvPath}
          cvFileName={talent.cvFileName}
          recommendations={recommendations}
          canRequestRecommendation={viewer.id === userId}
        />
      </main>
    );
  }

  const { data: companyRow } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!companyRow) notFound();
  const company = toCompanyProfile(companyRow);

  const sections: ProfileDetailSection[] = [
    {
      title: "About",
      text: [company.companyStage, company.companySize]
        .filter(Boolean)
        .join(" · "),
    },
    { title: "How they work", chips: company.workEnvironment },
    { title: "What they value", chips: company.values },
    { title: "What they're looking for", chips: company.lookingFor },
    { title: "Who thrives here", text: company.whoThrivesHere },
    { title: "What they're building", text: company.description },
  ];

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <ProfileDetailShell
        eyebrow="Company profile"
        photo={company.logo}
        initial={companyInitials(company.companyName)}
        gender={null}
        name={company.companyName}
        subtitle={company.mission}
        meta={[company.industry, company.location].filter(Boolean).join(" · ")}
        sections={sections}
        whyMatch={null}
        matchReport={matchBundle.report}
        initialFeedback={matchBundle.feedback}
        whatToExplore={COMPANY_EXPLORE_PROMPTS}
        viewerId={viewer.id}
        targetUserId={userId}
        initialConnectionStatus={connectionStatus}
        initiallySaved={initiallySaved}
      />
    </main>
  );
}
