import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { MatchReviewActions } from "@/components/admin/MatchReviewActions";
import { MatchReportBody } from "@/components/matching/MatchReport";
import { requireAdmin } from "@/lib/admin/access";
import {
  loadMatchReview,
  loadReviewAudit,
  type MatchReviewRow,
} from "@/lib/admin/reviews";
import { loadCompanyMatchInput, loadTalentMatchInput } from "@/lib/matching/context";
import { computeMatch } from "@/lib/matching/engine";
import {
  buildMatchReport,
  emptyMatchReport,
  type MatchConfidence,
  type MatchReport,
} from "@/lib/matching/report";

function isConfidence(value: string | null): value is MatchConfidence {
  return value === "High" || value === "Medium" || value === "Low";
}

function snapshotReport(row: MatchReviewRow): MatchReport {
  const overall = row.overall ?? 0;
  const base = emptyMatchReport("company", overall);
  return {
    ...base,
    axes: [
      { id: "role", label: "Role Fit", score: row.role_fit ?? 0 },
      { id: "company", label: "Company Fit", score: row.company_fit ?? 0 },
      { id: "motivation", label: "Motivation Fit", score: row.motivation_fit ?? 0 },
    ],
    confidence: isConfidence(row.confidence) ? row.confidence : "Low",
  };
}

export default async function AdminMatchDetailPage({
  params,
}: PageProps<"/admin/matches/[roleId]/[candidateId]">) {
  const { roleId, candidateId } = await params;
  const { supabase } = await requireAdmin();
  const review = await loadMatchReview(supabase, roleId, candidateId);
  if (!review) notFound();

  const [talent, company, audit] = await Promise.all([
    loadTalentMatchInput(supabase, candidateId),
    loadCompanyMatchInput(supabase, review.company_id),
    loadReviewAudit(supabase, review.id),
  ]);

  const report =
    talent && company
      ? buildMatchReport(computeMatch(talent, company), talent, company, "company")
      : snapshotReport(review);

  return (
    <AdminShell title="Match review detail">
      <p className="text-sm text-mingle-text-secondary">
        {review.job_title || "Untitled role"} · {review.company_name || "Company"} ·{" "}
        {review.candidate_name || "Candidate"} · status{" "}
        <span className="capitalize text-mingle-text">{review.status}</span>
      </p>
      <Link
        href={`/profile/view/${candidateId}`}
        className="text-sm text-mingle-purple hover:underline"
      >
        Open candidate profile
      </Link>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-2xl border border-mingle-border bg-mingle-white p-6">
          <MatchReportBody report={report} />
        </section>
        <MatchReviewActions roleId={roleId} candidateId={candidateId} />
      </div>
      {review.note ? (
        <p className="text-sm text-mingle-text-secondary">
          Latest note: {review.note}
        </p>
      ) : null}
      <section className="rounded-2xl border border-mingle-border bg-mingle-white p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">
          Audit log
        </h2>
        {audit.length === 0 ? (
          <p className="text-sm text-mingle-text-secondary">No actions yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {audit.map((entry) => (
              <li key={entry.id} className="border-b border-mingle-border pb-2 last:border-0">
                <span className="capitalize font-medium">{entry.action}</span>
                {" · "}
                {entry.actor_email || "unknown"}
                {" · "}
                {new Date(entry.created_at).toLocaleString()}
                {entry.note ? (
                  <p className="mt-1 text-mingle-text-secondary">{entry.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
