import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ProfileDetailShell,
  type ProfileDetailSection,
} from "@/components/profile-detail/ProfileDetailShell";
import {
  whyMatchReasons,
  TALENT_EXPLORE_PROMPTS,
  COMPANY_EXPLORE_PROMPTS,
} from "@/lib/profile-detail/why-match";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { loadConnectionStatusWith } from "@/lib/connections/persistence";
import { loadSavedUserIds } from "@/lib/matching/saved";

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

  if (targetUser.user_type === "talent") {
    const { data: talentRow } = await supabase
      .from("talent_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!talentRow) notFound();
    const talent = toTalentProfile(talentRow);

    let whyMatch: string[] | null = null;
    if (viewerUser?.user_type === "company") {
      const { data: companyRow } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", viewer.id)
        .maybeSingle();
      if (companyRow) {
        whyMatch = whyMatchReasons(talent, toCompanyProfile(companyRow));
      }
    }

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
      { title: "Beyond the CV", text: talent.beyondCv },
    ];

    const initials =
      `${talent.firstName.charAt(0)}${talent.lastName.charAt(0)}`.toUpperCase();

    return (
      <main className="flex min-h-screen flex-1 flex-col">
        <ProfileDetailShell
          eyebrow="Talent profile"
          photo={talent.profilePhoto}
          initial={initials}
          name={`${talent.firstName} ${talent.lastName}`.trim()}
          subtitle={talent.headline}
          meta={[talent.location, talent.industry].filter(Boolean).join(" · ")}
          sections={sections}
          whyMatch={whyMatch}
          whatToExplore={TALENT_EXPLORE_PROMPTS}
          viewerId={viewer.id}
          targetUserId={userId}
          initialConnectionStatus={connectionStatus}
          initiallySaved={initiallySaved}
          cvPath={talent.cvPath}
          cvFileName={talent.cvFileName}
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

  let whyMatch: string[] | null = null;
  if (viewerUser?.user_type === "talent") {
    const { data: talentRow } = await supabase
      .from("talent_profiles")
      .select("*")
      .eq("user_id", viewer.id)
      .maybeSingle();
    if (talentRow) {
      whyMatch = whyMatchReasons(toTalentProfile(talentRow), company);
    }
  }

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
        initial={company.companyName.charAt(0).toUpperCase()}
        name={company.companyName}
        subtitle={company.mission}
        meta={[company.industry, company.location].filter(Boolean).join(" · ")}
        sections={sections}
        whyMatch={whyMatch}
        whatToExplore={COMPANY_EXPLORE_PROMPTS}
        viewerId={viewer.id}
        targetUserId={userId}
        initialConnectionStatus={connectionStatus}
        initiallySaved={initiallySaved}
      />
    </main>
  );
}
