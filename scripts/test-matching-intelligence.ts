/**
 * Lightweight scenario checks for recruiting intelligence.
 * Run: npx tsx scripts/test-matching-intelligence.ts
 */
import {
  computeMatch,
  type TalentMatchInput,
  type CompanyMatchInput,
} from "../lib/matching/engine";
import { buildMatchReport } from "../lib/matching/report";
import { EMPTY_PROFILE, type ProfileState } from "../lib/profile/persistence";
import {
  EMPTY_COMPANY_PROFILE,
  type CompanyProfileState,
} from "../lib/company-profile/persistence";

function talentProfile(overrides: Partial<ProfileState> = {}): ProfileState {
  return {
    ...EMPTY_PROFILE,
    firstName: "A",
    lastName: "B",
    headline: "Engineer",
    location: "Tel Aviv",
    yearsExperience: 5,
    currentRole: "Engineer",
    industry: "Fintech",
    drives: ["Ownership", "Craft"],
    workStyle: ["Remote first", "Async"],
    skills: ["React", "TypeScript"],
    salaryExpectation: 25000,
    targetRole: "Frontend engineer",
    isEmployed: true,
    startAvailability: "Immediate",
    ...overrides,
  };
}

function companyProfile(
  overrides: Partial<CompanyProfileState> = {},
): CompanyProfileState {
  return {
    ...EMPTY_COMPANY_PROFILE,
    companyName: "Acme",
    mission: "Build great products",
    industry: "B2B SaaS",
    location: "Tel Aviv",
    companyStage: "Growth",
    companySize: "51-200",
    lookingFor: ["Frontend"],
    values: ["Ownership", "Craft"],
    workEnvironment: ["Remote first", "Async"],
    ...overrides,
  };
}

function scenario(
  name: string,
  talent: TalentMatchInput,
  company: CompanyMatchInput,
) {
  const result = computeMatch(talent, company);
  const report = buildMatchReport(result, talent, company, "company");
  console.log(`\n=== ${name} ===`);
  console.log(
    `score=${report.overall} confidence=${report.confidence} tier=${report.discoveryTier}`,
  );
  console.log(`mutual: ${report.mutualSummary}`);
  console.log(`next: ${report.recommendedNextStep} — ${report.nextStepReason}`);
  console.log(
    `axes: ${report.axes.map((a) => `${a.label}=${a.score}`).join(" · ")}`,
  );
  console.log(`why: ${report.why.map((w) => w.label).join(", ") || "(none)"}`);
  console.log(
    `risks: ${report.risks.map((r) => `${r.label}[${r.gapKind}]`).join(", ") || "(none)"}`,
  );
  console.log(`validate: ${report.whatToValidate[0] ?? "(none)"}`);
  console.log(`confidenceReason: ${report.confidenceReason}`);
  return report;
}

const baseTalent: TalentMatchInput = {
  profile: talentProfile(),
  careerGoal: "Full time opportunity",
  companyTypes: ["Scale up"],
  salaryExpectation: 25000,
};

const baseCompany: CompanyMatchInput = {
  profile: companyProfile(),
  connectingAbout: "Hiring now",
  culturePriorities: ["Experience", "Skills"],
  roleTitle: "Frontend Engineer",
  roleDepartment: "Engineering",
  roleRequiredSkills: ["React", "TypeScript", "CSS"],
  salaryMin: 22000,
  salaryMax: 28000,
};

scenario("Strong exact match", baseTalent, baseCompany);

scenario(
  "Transferable skills (Vue → React group)",
  {
    ...baseTalent,
    profile: talentProfile({
      skills: ["Vue", "JavaScript"],
      industry: "B2B fintech software",
    }),
  },
  {
    ...baseCompany,
    roleRequiredSkills: ["React", "TypeScript"],
  },
);

scenario(
  "Strong role, weak motivation",
  {
    ...baseTalent,
    profile: talentProfile({
      drives: ["Compensation"],
      skills: ["React", "TypeScript", "CSS"],
    }),
  },
  {
    ...baseCompany,
    profile: companyProfile({ values: ["Mission", "Impact"] }),
  },
);

scenario(
  "Missing information",
  {
    profile: talentProfile({
      skills: [],
      drives: [],
      workStyle: [],
      yearsExperience: null,
      industry: "",
      headline: "",
      currentRole: "",
      targetRole: "",
      isEmployed: null,
      startAvailability: null,
    }),
    careerGoal: "",
    companyTypes: [],
  },
  {
    profile: companyProfile({
      values: [],
      workEnvironment: [],
      mission: "",
      companySize: "",
    }),
    connectingAbout: "",
    culturePriorities: [],
    roleRequiredSkills: null,
  },
);

scenario(
  "Location preference gap",
  {
    ...baseTalent,
    profile: talentProfile({ location: "Berlin", workStyle: ["Remote first"] }),
  },
  {
    ...baseCompany,
    profile: companyProfile({
      location: "London",
      workEnvironment: ["Office based", "In person energy"],
    }),
  },
);

console.log("\nAll scenarios completed.\n");
