import { notFound } from "next/navigation";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import {
  ProfileDetailShell,
  type ProfileDetailSection,
} from "@/components/profile-detail/ProfileDetailShell";
import {
  filterTalentExplorePrompts,
  filterCompanyExplorePrompts,
} from "@/lib/profile-detail/why-match";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { talentDisplayHeadline, talentDisplayMeta } from "@/lib/profile-detail/display";
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
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveTalentCvForViewer } from "@/lib/profile/cv-resolve";
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

function traitChipsFromText(raw: string): string[] | null {
  const parts = raw
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (
    parts.length >= 2 &&
    parts.every((part) => part.length <= 40 && !part.includes("."))
  ) {
    return parts;
  }
  return null;
}

export default async function ProfileViewPage({
  params,
}: PageProps<"/profile/view/[userId]">) {
  const { userId } = await params;
  const { supabase, user: viewer, userRow: viewerUser } = await requireAppUser();

  const { data: targetUser } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", userId)
    .maybeSingle();
  if (!targetUser) notFound();

  const isSelf = viewer.id === userId;

  const [connectionStatus, savedIds, matchBundle] = await Promise.all([
    isSelf
      ? Promise.resolve(null)
      : loadConnectionStatusWith(supabase, viewer.id, userId),
    isSelf
      ? Promise.resolve([] as string[])
      : loadSavedUserIds(supabase, viewer.id),
    isSelf
      ? Promise.resolve({ report: null, feedback: null })
      : loadViewerMatchReport(
          supabase,
          viewer.id,
          viewerUser.user_type,
          userId,
          targetUser.user_type,
        ),
  ]);
  const initiallySaved = savedIds.includes(userId);

  if (targetUser.user_type === "talent") {
    const [{ data: talentRow }, recommendations] = await Promise.all([
      supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      loadSubmittedRecommendations(supabase, userId),
    ]);
    if (!talentRow) notFound();
    const talent = toTalentProfile(talentRow);
    const resolvedCv = await resolveTalentCvForViewer(
      userId,
      talent.cvPath,
      talent.cvFileName,
    );

    const sections: ProfileDetailSection[] = [
      {
        title: "Professional background",
        text: [
          talent.currentRole,
          talent.targetRole.trim() ? `Looking for: ${talent.targetRole.trim()}` : null,
          talent.yearsExperience !== null
            ? `${talent.yearsExperience} years experience`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      },
      {
        title: "Search status",
        text: [
          talent.isEmployed === null
            ? null
            : talent.isEmployed
              ? talent.discreetSearch
                ? "Employed · Discreet search"
                : "Employed · Open search"
              : talent.discreetSearch
                ? "Not employed · Discreet search"
                : "Not employed",
          talent.startAvailability
            ? `Available: ${talent.startAvailability}`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      },
      { title: "What drives them", chips: talent.drives },
      { title: "How they work", chips: talent.workStyle },
      { title: "What they're looking for", chips: talent.lookingFor },
      { title: "Skills", chips: talent.skills },
      ...(talent.githubUrl
        ? [
            {
              title: "GitHub",
              text: talent.githubLogin
                ? `@${talent.githubLogin}`
                : talent.githubUrl,
            } satisfies ProfileDetailSection,
          ]
        : []),
      { title: "Beyond the CV", text: talent.beyondCv },
    ];

    const initials = personInitials(talent.firstName, talent.lastName);

    return (
      <>
        <DashboardHeading>Profile</DashboardHeading>
        {isSelf ? (
          <div className="mx-auto w-full max-w-4xl pb-4">
            <CandidateDnaPanel dna={buildCandidateDna(talent)} />
          </div>
        ) : null}
        <ProfileDetailShell
          eyebrow="Talent profile"
          photo={talent.profilePhoto}
          initial={initials}
          gender={talent.gender}
          name={`${talent.firstName} ${talent.lastName}`.trim()}
          subtitle={talentDisplayHeadline(talent.headline, talent.location, talent.currentRole)}
          meta={talentDisplayMeta(
            talent.location,
            talent.industry,
            talent.headline,
            talent.currentRole,
          )}
          sections={sections}
          whyMatch={null}
          matchReport={matchBundle.report}
          initialFeedback={matchBundle.feedback}
          whatToExplore={filterTalentExplorePrompts(talent)}
          viewerId={viewer.id}
          targetUserId={userId}
          initialConnectionStatus={connectionStatus}
          initiallySaved={initiallySaved}
          cvPath={resolvedCv.cvPath}
          cvFileName={resolvedCv.cvFileName}
          showCv
          recommendations={recommendations}
          canRequestRecommendation={isSelf}
        />
      </>
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
    (() => {
      const thriveChips = traitChipsFromText(company.whoThrivesHere);
      return thriveChips
        ? { title: "Who thrives here", chips: thriveChips }
        : { title: "Who thrives here", text: company.whoThrivesHere };
    })(),
    {
      title: "What they're building",
      text: company.description?.trim()
        ? company.description
        : undefined,
    },
  ];

  return (
    <>
      <DashboardHeading>Profile</DashboardHeading>
      <ProfileDetailShell
        eyebrow="Company profile"
        photo={company.logo}
        initial={companyInitials(company.companyName)}
        gender={null}
        avatarShape="soft"
        name={company.companyName}
        subtitle={company.mission}
        meta={[company.industry, company.location].filter(Boolean).join(" · ")}
        sections={sections}
        whyMatch={null}
        matchReport={matchBundle.report}
        initialFeedback={matchBundle.feedback}
        whatToExplore={filterCompanyExplorePrompts(company)}
        viewerId={viewer.id}
        targetUserId={userId}
        initialConnectionStatus={connectionStatus}
        initiallySaved={initiallySaved}
      />
    </>
  );
}
