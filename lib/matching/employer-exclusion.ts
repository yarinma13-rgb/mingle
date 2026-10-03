import { emailDomain, isPersonalEmail } from "@/lib/auth/work-email";

// Safety: a candidate must never appear as a match or search result to
// their OWN current employer. If an employer notices one of their own
// employees quietly job-hunting on mingle, that person could be fired —
// so this applies unconditionally, by default, for every candidate, not
// only ones who marked themselves as a discreet searcher.
//
// Two independent signals, either one triggers exclusion:
//
// 1. Verified work-email domain. Company accounts can only sign up with a
//    work email (see lib/auth/work-email.ts), so if a candidate's own
//    email shares that same domain, they almost certainly work there — no
//    disclosure needed, and it still works even if the candidate forgot
//    to mark discreet search. Deliberately narrow: only acts on a real
//    company domain (never a shared personal/free provider like
//    gmail.com, which would wrongly exclude every candidate who happens
//    to use the same free mailbox as the company account).
//
// 2. Self-reported current employer name, required in onboarding when the
//    candidate says they're currently employed (see ProfileWizard.tsx /
//    lib/profile/persistence.ts `currentEmployer`). Catches the case
//    where someone signed up with a personal email but still disclosed
//    where they work. Matched after light normalization (case, legal
//    suffixes, punctuation) — never fuzzy/approximate, to avoid wrongly
//    excluding a candidate over an unrelated company with a similar name.
//
// Does not attempt to infer employer from CV text or job history — too
// unreliable for a safety filter; false negatives here are a real-world
// harm, so every signal has to be exact, not guessed.

/** The company's own domain to exclude candidates on, or null if it
 *  can't act as a safe exclusion signal (missing, or a free/personal
 *  mailbox shared by many unrelated accounts). */
export function employerDomainForExclusion(
  companyEmail: string | null | undefined,
): string | null {
  if (!companyEmail) return null;
  if (isPersonalEmail(companyEmail)) return null;
  return emailDomain(companyEmail);
}

/** True when this candidate's email domain matches the company's own
 *  domain — i.e. they almost certainly work there and must be excluded. */
export function isOwnEmployeeByDomain(
  candidateEmail: string | null | undefined,
  companyDomain: string | null,
): boolean {
  if (!companyDomain || !candidateEmail) return false;
  return emailDomain(candidateEmail) === companyDomain;
}

// Legal-entity words stripped as whole tokens only, never as a substring —
// so "Apex" and "ApexTech" still normalize differently and never collide.
const COMPANY_SUFFIX_WORDS = new Set([
  "ltd",
  "llc",
  "inc",
  "co",
  "corp",
  "limited",
  "company",
  "group",
  "technologies",
  "technology",
  "tech",
  "software",
  "solutions",
  "labs",
  "holdings",
]);

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0 && !COMPANY_SUFFIX_WORDS.has(word))
    .join("");
}

/** True when the candidate's self-reported current employer normalizes to
 *  the same name as this company — i.e. they disclosed working there and
 *  must be excluded. Exact match after normalization only, never a
 *  substring/fuzzy match — a false positive here wrongly hides a
 *  candidate from an unrelated company. */
export function isOwnEmployeeByName(
  candidateCurrentEmployer: string | null | undefined,
  companyName: string | null | undefined,
): boolean {
  const employer = candidateCurrentEmployer?.trim();
  const company = companyName?.trim();
  if (!employer || !company) return false;
  const normalizedEmployer = normalizeCompanyName(employer);
  const normalizedCompany = normalizeCompanyName(company);
  if (!normalizedEmployer || !normalizedCompany) return false;
  return normalizedEmployer === normalizedCompany;
}
