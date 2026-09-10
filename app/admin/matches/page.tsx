import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/access";
import { loadMatchReviews } from "@/lib/admin/reviews";

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export default async function AdminMatchListPage({
  searchParams,
}: PageProps<"/admin/matches">) {
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const status = one(query.status);
  const company = one(query.company);
  const sort = one(query.sort) || "score";
  const rows = await loadMatchReviews(supabase, { status, company, sort });

  return (
    <AdminShell title="Match review">
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-4">
        <label className="flex flex-col gap-1 text-xs">
          Status
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-mingle-border bg-mingle-bg px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Company
          <input
            name="company"
            defaultValue={company}
            className="rounded-lg border border-mingle-border bg-mingle-bg px-2 py-1.5 text-sm"
            placeholder="Filter by company"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Sort
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-lg border border-mingle-border bg-mingle-bg px-2 py-1.5 text-sm"
          >
            <option value="score">Overall score</option>
            <option value="status">Status</option>
            <option value="confidence">Confidence</option>
          </select>
        </label>
        <button type="submit" className="mingle-btn-secondary text-xs">
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-mingle-text-secondary">
          No matches in the queue yet. The list fills when a company opens a
          role&apos;s Top 5 results.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-mingle-border bg-mingle-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-mingle-border text-[11px] uppercase tracking-wide text-mingle-text-secondary">
              <tr>
                <th className="px-3 py-2 font-semibold">Job</th>
                <th className="px-3 py-2 font-semibold">Candidate</th>
                <th className="px-3 py-2 font-semibold">Overall</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Company</th>
                <th className="px-3 py-2 font-semibold">Motivation</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-mingle-border last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/matches/${row.role_id}/${row.candidate_id}`}
                      className="font-medium text-mingle-purple hover:underline"
                    >
                      {row.job_title || "Untitled role"}
                    </Link>
                    <p className="text-[11px] text-mingle-text-secondary">
                      {row.company_name || "Company"}
                    </p>
                  </td>
                  <td className="px-3 py-2">{row.candidate_name || "Candidate"}</td>
                  <td className="px-3 py-2 font-semibold">{row.overall ?? "—"}</td>
                  <td className="px-3 py-2">{row.role_fit ?? "—"}</td>
                  <td className="px-3 py-2">{row.company_fit ?? "—"}</td>
                  <td className="px-3 py-2">{row.motivation_fit ?? "—"}</td>
                  <td className="px-3 py-2">{row.confidence ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
