import { emailDomain, isPersonalEmail } from "@/lib/auth/work-email";

// Safety: a candidate must never appear as a match or search result to
// their OWN current employer. If an employer notices one of their own
// employees quietly job-hunting on mingle, that person could be fired —
// so this applies unconditionally, by default, for every candidate, not
// only ones who marked themselves as a discreet searcher.
//
// Signal used: verified work-email domain. Company accounts can only sign
// up with a work email (see lib/auth/work-email.ts), so if a candidate's
// own email shares that same domain, they almost certainly work there —
// no self-reported "current employer" field needed, and it still works
// even if the candidate forgot to mark discreet search.
//
// Deliberately narrow: only acts on a real company domain (never a shared
// personal/free provider like gmail.com, which would wrongly exclude
// every candidate who happens to use the same free mailbox as the
// company account). Does not attempt to infer employer from CV text or
// job history — too unreliable for a safety filter; false negatives here
// are a real-world harm, so the signal has to be exact, not guessed.

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
