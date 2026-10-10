/**
 * Local smoke checks for the pure/DB-free parts of the talent exchange
 * module. The interest/mutual state machine itself (expressCompanyInterest,
 * respondToCompanyInterest, setCandidateVisibility) talks directly to
 * Supabase and has no mockable seam here — that's covered by the manual
 * end-to-end browser verification in the feature plan instead, not here.
 * Run: npx --yes tsx lib/talent-exchange/talent-exchange.smoke.ts
 */
import { TALENT_EXCHANGE_MATCH_THRESHOLD } from "@/lib/talent-exchange/recommendations";
import type { AnonymousCandidateCard } from "@/lib/talent-exchange/anonymize";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// Fields that must never appear anywhere on an anonymous candidate card.
// Checked against the TYPE's own key list (not a runtime instance) so this
// fails at compile time — via the `never` assignment below — the moment
// anyone adds one of these keys to AnonymousCandidateCard, before it could
// ever leak through a spread.
type BannedKey =
  | "name"
  | "firstName"
  | "lastName"
  | "photo"
  | "profilePhoto"
  | "email"
  | "phone"
  | "linkedIn"
  | "linkedin"
  | "currentEmployer"
  | "cvPath"
  | "cvFileName"
  | "rejectionReason"
  | "interviewNotes"
  | "interviewFeedback";

type LeakedKeys = Extract<keyof AnonymousCandidateCard, BannedKey>;
// If this line fails to compile, a banned field was added to the card type.
const _noLeakedKeys: LeakedKeys extends never ? true : false = true;
void _noLeakedKeys;

function run() {
  expect(
    Number.isFinite(TALENT_EXCHANGE_MATCH_THRESHOLD),
    "threshold must resolve to a finite number",
  );
  expect(
    TALENT_EXCHANGE_MATCH_THRESHOLD > 0 && TALENT_EXCHANGE_MATCH_THRESHOLD <= 100,
    `threshold ${TALENT_EXCHANGE_MATCH_THRESHOLD} should be a plausible 0-100 score cutoff`,
  );

  console.log("talent-exchange smoke: all checks passed");
}

run();
