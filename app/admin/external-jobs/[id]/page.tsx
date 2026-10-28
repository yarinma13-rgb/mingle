import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { SubmitButton } from "@/components/admin/external-jobs/SubmitButton";
import { ActionButton, inputClass, Panel, StatusPill, when } from "@/components/admin/external-jobs/ui";
import { requireAdmin } from "@/lib/admin/access";
import { editJobAction, jobAction } from "@/lib/external-jobs/admin-actions";
import { adminDbOrNull, loadJobDetail } from "@/lib/external-jobs/admin-data";
import { EMPLOYMENT_LABELS } from "@/lib/external-jobs/candidate";
import { parseChecks } from "@/lib/external-jobs/validate";
import { EXTERNAL_JOB_DISCLAIMER, JOB_CATEGORIES, WORK_MODELS } from "@/lib/external-jobs/types";

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export default async function ExternalJobAdminDetail({
  params,
  searchParams,
}: PageProps<"/admin/external-jobs/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireAdmin();
  const db = adminDbOrNull();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await loadJobDetail(db, id);
  if (!detail) notFound();
  const { job, source, snapshot, events, stats } = detail;
  const checks = parseChecks(job.validation);
  const back = `/admin/external-jobs/${id}`;
  const msg = one(query.msg);

  return (
    <AdminShell title={job.title}>
      <Link href="/admin/external-jobs?tab=pending" className="text-xs text-mingle-text-secondary hover:underline">
        ← External jobs
      </Link>
      {msg ? (
        <p role="status" className="rounded-xl border border-mingle-border bg-mingle-lavender/60 px-4 py-3 text-sm text-mingle-text">
          {msg}
        </p>
      ) : null}

      <Panel title="Status">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusPill status={job.status} />
          <span className="text-mingle-text-secondary">
            {job.company_name} · source {source?.company_name ?? "—"} ({source?.source_type}) · external id {job.external_id}
          </span>
        </div>
        {job.status_reason ? <p className="text-sm text-mingle-text">{job.status_reason}</p> : null}
        <p className="text-xs text-mingle-text-secondary">
          First seen {when(job.first_seen_at)} · last seen {when(job.last_seen_at)} · verified {when(job.last_verified_at)} ·
          processed {when(job.processed_at)} ({job.ai_model ?? "—"}) · published {when(job.published_at)} · {stats.views} views ·{" "}
          {stats.clicks} apply clicks · {stats.saves} saves
        </p>
        <p className="text-xs">
          <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-mingle-purple hover:underline">Source page</a>
          {" · "}
          <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="text-mingle-purple hover:underline">Apply link</a>
          {job.status === "published" ? (
            <>
              {" · "}
              <Link href={`/jobs/${job.id}`} className="text-mingle-purple hover:underline">Candidate view</Link>
            </>
          ) : null}
        </p>
        <form action={jobAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="jobId" value={job.id} />
          <input type="hidden" name="returnTo" value={back} />
          <label className="flex flex-col gap-1 text-xs">
            Note (logged)
            <input name="note" className={inputClass} />
          </label>
          {job.status !== "published" && job.status !== "removed" ? (
            <SubmitButton name="op" value="publish" className="mingle-btn-primary text-xs">Publish</SubmitButton>
          ) : null}
          {job.status === "published" ? <SubmitButton name="op" value="pause" className="mingle-btn-secondary text-xs">Hide (pause)</SubmitButton> : null}
          <SubmitButton name="op" value="reprocess" className="mingle-btn-secondary text-xs">Re-run AI on next crawl</SubmitButton>
          <SubmitButton name="op" value="expire" className="mingle-btn-secondary text-xs">Mark closed</SubmitButton>
          <SubmitButton name="op" value="reject" className="mingle-btn-secondary text-xs">Reject</SubmitButton>
          <SubmitButton name="op" value="remove" className="mingle-btn-secondary text-xs">Remove</SubmitButton>
        </form>
        <p className="text-[11px] text-mingle-text-secondary">
          Manual publish still re-checks the apply link, duplicates and source permission; those can’t be overridden.
        </p>
      </Panel>

      <Panel title="Mandatory checks (last run)">
        {checks.length === 0 ? (
          <p className="text-sm text-mingle-text-secondary">Not validated yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-xs">
            {checks.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span className={c.passed ? "text-mingle-success" : "text-mingle-error"}>{c.passed ? "✓" : "✗"}</span>
                <span>
                  <strong>{c.label}.</strong> {c.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Source text (as collected)">
          <pre dir="auto" className="max-h-[36rem] overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-mingle-text">
            {snapshot?.source_text ?? "—"}
          </pre>
        </Panel>
        <Panel title="Edit published content">
          <form action={editJobAction} className="flex flex-col gap-2 text-xs">
            <input type="hidden" name="jobId" value={job.id} />
            <label className="flex flex-col gap-1">Title<input name="title" defaultValue={job.title} required className={inputClass} /></label>
            <label className="flex flex-col gap-1">Company<input name="companyName" defaultValue={job.company_name} required className={inputClass} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">Location<input name="location" defaultValue={job.location ?? ""} className={inputClass} /></label>
              <label className="flex flex-col gap-1">Seniority<input name="seniority" defaultValue={job.seniority ?? ""} className={inputClass} /></label>
              <label className="flex flex-col gap-1">
                Work model
                <select name="workModel" defaultValue={job.work_model ?? ""} className={inputClass}>
                  <option value="">—</option>
                  {WORK_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                Employment type
                <select name="employmentType" defaultValue={job.employment_type ?? ""} className={inputClass}>
                  <option value="">—</option>
                  {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                Category
                <select name="category" defaultValue={job.category ?? "Other"} className={inputClass}>
                  {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">Apply URL<input name="applyUrl" type="url" defaultValue={job.apply_url} required className={inputClass} /></label>
            </div>
            <label className="flex flex-col gap-1">Summary<textarea name="summary" rows={4} defaultValue={job.summary ?? ""} dir="auto" className={inputClass} /></label>
            <label className="flex flex-col gap-1">Responsibilities (one per line)<textarea name="responsibilities" rows={4} defaultValue={job.responsibilities.join("\n")} dir="auto" className={inputClass} /></label>
            <label className="flex flex-col gap-1">Requirements (one per line)<textarea name="requirements" rows={4} defaultValue={job.requirements.join("\n")} dir="auto" className={inputClass} /></label>
            <label className="flex flex-col gap-1">Nice to have (one per line)<textarea name="niceToHave" rows={3} defaultValue={job.nice_to_have.join("\n")} dir="auto" className={inputClass} /></label>
            <label className="flex flex-col gap-1">Tags (comma separated)<input name="tags" defaultValue={job.tags.join(", ")} className={inputClass} /></label>
            <p className="text-[11px] text-mingle-text-secondary">
              Keep to facts in the source text, in your own words. Shown with: “{EXTERNAL_JOB_DISCLAIMER}”
            </p>
            <div>
              <SubmitButton className="mingle-btn-primary text-xs" pendingLabel="Saving…">Save edits</SubmitButton>
            </div>
          </form>
        </Panel>
      </div>

      <Panel title="History">
        <ul className="flex flex-col divide-y divide-mingle-border text-xs">
          {events.map((e) => (
            <li key={e.id} className="flex flex-col gap-0.5 py-2">
              <span>
                <span className="text-mingle-text-secondary">{when(e.created_at)}</span> <strong>{e.kind}</strong>{" "}
                <span className="text-mingle-text-secondary">{e.actor}</span>
              </span>
              {e.message ? <span>{e.message}</span> : null}
              {e.detail ? (
                <details>
                  <summary className="cursor-pointer text-mingle-text-secondary">details</summary>
                  <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-mingle-bg p-2 text-[11px]">
                    {JSON.stringify(e.detail, null, 2)}
                  </pre>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
      <div>
        <ActionButton action={jobAction} fields={{ jobId: job.id, op: "remove", returnTo: back }} label="Remove permanently from mingle" tone="danger" />
      </div>
    </AdminShell>
  );
}
