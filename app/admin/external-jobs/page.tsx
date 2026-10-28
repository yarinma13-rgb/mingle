import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { SourcesPanel } from "@/components/admin/external-jobs/SourcesPanel";
import { ActionButton, inputClass, Panel, StatusPill, when } from "@/components/admin/external-jobs/ui";
import { KpiTile } from "@/components/dashboard/KpiTile";
import {
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  GaugeIcon,
  PeopleIcon,
  TargetIcon,
  BookmarkIcon,
  CompassIcon,
} from "@/components/dashboard/icons";
import { requireAdmin } from "@/lib/admin/access";
import {
  adminDbOrNull,
  JOB_TABS,
  loadEvents,
  loadJobsForTab,
  loadOverview,
  loadSources,
  loadTakedowns,
} from "@/lib/external-jobs/admin-data";
import { jobAction, settingsAction, takedownAdminAction } from "@/lib/external-jobs/admin-actions";
import { failedChecks, parseChecks } from "@/lib/external-jobs/validate";

const BASE = "/admin/external-jobs";

const TABS: Array<[string, string]> = [
  ["overview", "Analytics"],
  ["sources", "Sources"],
  ["discovered", "Discovered"],
  ["published", "Published"],
  ["pending", "Pending Review"],
  ["rejected", "Rejected"],
  ["expired", "Expired"],
  ["logs", "AI Processing Logs"],
  ["takedowns", "Removal requests"],
];

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export default async function ExternalJobsAdminPage({ searchParams }: PageProps<"/admin/external-jobs">) {
  const query = await searchParams;
  await requireAdmin();
  const tab = TABS.some(([key]) => key === one(query.tab)) ? one(query.tab) : "overview";
  const msg = one(query.msg);
  const db = adminDbOrNull();

  return (
    <AdminShell title="External jobs">
      <nav className="flex flex-wrap gap-1.5" aria-label="External jobs sections">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`${BASE}?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === key
                ? "bg-mingle-accent-purple text-white"
                : "border border-mingle-border text-mingle-text-secondary hover:text-mingle-text"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {msg ? (
        <p role="status" className="rounded-xl border border-mingle-border bg-mingle-lavender/60 px-4 py-3 text-sm text-mingle-text">
          {msg}
        </p>
      ) : null}

      <EnvChecklist />

      {!db ? (
        <p className="text-sm text-mingle-error">
          SUPABASE_SERVICE_ROLE_KEY is not configured. The engine and this dashboard need it.
        </p>
      ) : tab === "overview" ? (
        <OverviewTab db={db} />
      ) : tab === "sources" ? (
        <SourcesPanel sources={await loadSources(db)} />
      ) : tab === "logs" ? (
        <LogsTab db={db} kind={one(query.kind)} />
      ) : tab === "takedowns" ? (
        <TakedownsTab db={db} />
      ) : (
        <JobsTab db={db} tab={tab} q={one(query.q)} />
      )}
    </AdminShell>
  );
}

type Db = NonNullable<ReturnType<typeof adminDbOrNull>>;

/**
 * Which settings this deployment can see (names only, never values), so a
 * missing or wrongly-scoped Vercel variable is obvious. Hidden once all set.
 */
function EnvChecklist() {
  const vars: Array<[string, boolean, string]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", true, "database address"],
    ["SUPABASE_SERVICE_ROLE_KEY", true, "engine and dashboard"],
    ["GEMINI_API_KEY", true, "AI rewrite; without it nothing is published"],
    ["CRON_SECRET", true, "daily crawl"],
    ["RESEND_API_KEY", false, "alert and removal emails"],
  ];
  const rows = vars.map(([name, required, purpose]) => ({
    name,
    required,
    purpose,
    present: Boolean(process.env[name]?.trim()),
  }));
  if (rows.every((r) => r.present || !r.required)) return null;
  return (
    <Panel title={`Settings this deployment sees (${process.env.VERCEL_ENV ?? "local"})`}>
      <ul className="flex flex-col gap-1 text-xs">
        {rows.map((r) => (
          <li key={r.name} className="flex gap-2">
            <span className={r.present ? "text-mingle-success" : r.required ? "text-mingle-error" : "text-mingle-text-secondary"}>
              {r.present ? "✓" : "✗"}
            </span>
            <code>{r.name}</code>
            <span className="text-mingle-text-secondary">
              {r.purpose}
              {!r.present && !r.required ? " (optional)" : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-mingle-text-secondary">
        Missing here but set in Vercel? Check the variable is enabled for this environment, then redeploy this deployment.
      </p>
    </Panel>
  );
}

async function OverviewTab({ db }: { db: Db }) {
  const o = await loadOverview(db);
  const maxDay = Math.max(1, ...o.publishedPerDay.map((d) => d.count));
  const ctr = o.views30d ? `${Math.round((o.clicks30d / o.views30d) * 100)}%` : "—";
  return (
    <>
      <Panel title="Engine controls">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            Daily crawling: <strong>{o.settings.crawlingEnabled ? "on" : "paused"}</strong>
          </span>
          <ActionButton
            action={settingsAction}
            fields={{ field: "crawling_enabled", value: String(!o.settings.crawlingEnabled) }}
            label={o.settings.crawlingEnabled ? "Pause crawling" : "Resume crawling"}
          />
          <span className="ml-2">
            Auto-publishing: <strong>{o.settings.autoPublishEnabled ? "on" : "paused"}</strong>
          </span>
          <ActionButton
            action={settingsAction}
            fields={{ field: "auto_publish_enabled", value: String(!o.settings.autoPublishEnabled) }}
            label={o.settings.autoPublishEnabled ? "Pause auto-publishing" : "Resume auto-publishing"}
          />
        </div>
        <p className="text-xs text-mingle-text-secondary">
          Sources: {o.sources.active} active · {o.sources.paused} paused · {o.sources.failing} failing ·{" "}
          {o.sources.publishingPaused} with auto-publish paused · {o.openTakedowns} open removal request(s)
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiTile icon={CheckCircleIcon} label="Published" value={String(o.counts.published)} accent="success" href={`${BASE}?tab=published`} />
        <KpiTile icon={ClockIcon} label="Pending review" value={String(o.counts.pending_review + o.counts.paused)} accent="waiting" href={`${BASE}?tab=pending`} />
        <KpiTile icon={CompassIcon} label="Discovered (queued)" value={String(o.counts.discovered)} accent="blue" href={`${BASE}?tab=discovered`} />
        <KpiTile icon={BriefcaseIcon} label="Expired / removed" value={String(o.counts.expired + o.counts.removed)} accent="purple" href={`${BASE}?tab=expired`} />
        <KpiTile icon={PeopleIcon} label="Views (30d)" value={String(o.views30d)} accent="violet" href={BASE} />
        <KpiTile icon={TargetIcon} label="Apply clicks (30d)" value={String(o.clicks30d)} accent="pink" href={BASE} />
        <KpiTile icon={GaugeIcon} label="Click-through" value={ctr} accent="magenta" href={BASE} />
        <KpiTile icon={BookmarkIcon} label="Saves (30d)" value={String(o.saves30d)} accent="blue" href={BASE} />
      </div>

      <Panel title="Published per day (14 days)">
        <div className="flex h-28 items-end gap-1" role="img" aria-label="Jobs published per day over the last 14 days">
          {o.publishedPerDay.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.count}`}>
              <div
                className="w-full rounded-t bg-mingle-accent-purple/70"
                style={{ height: `${Math.max(2, (d.count / maxDay) * 88)}px` }}
              />
              <span className="text-[10px] text-mingle-text-secondary">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Top jobs by apply clicks (30d)">
          {o.topJobs.length === 0 ? (
            <p className="text-sm text-mingle-text-secondary">No engagement yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-mingle-text-secondary">
                <tr><th className="py-1">Job</th><th>Views</th><th>Clicks</th></tr>
              </thead>
              <tbody>
                {o.topJobs.map((j) => (
                  <tr key={j.id} className="border-t border-mingle-border">
                    <td className="py-1.5"><Link href={`${BASE}/${j.id}`} className="hover:underline">{j.title}</Link> <span className="text-mingle-text-secondary">· {j.company}</span></td>
                    <td>{j.views}</td>
                    <td>{j.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="Recent crawl runs">
          {o.runs.length === 0 ? (
            <p className="text-sm text-mingle-text-secondary">No runs yet. The cron runs daily at 04:00 UTC.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-mingle-text-secondary">
                <tr><th className="py-1">Started</th><th>Seen</th><th>New</th><th>Pub.</th><th>Review</th><th>Exp.</th><th>Errors</th></tr>
              </thead>
              <tbody>
                {o.runs.map((r) => (
                  <tr key={r.id} className="border-t border-mingle-border">
                    <td className="py-1.5">{when(r.started_at)} <span className="text-mingle-text-secondary">{r.trigger}{r.finished_at ? "" : " · running/cut off"}</span></td>
                    <td>{r.stats.jobsSeen ?? 0}</td>
                    <td>{r.stats.discovered ?? 0}</td>
                    <td>{(r.stats.published ?? 0) + (r.stats.updated ?? 0)}</td>
                    <td>{r.stats.pendingReview ?? 0}</td>
                    <td>{r.stats.expired ?? 0}</td>
                    <td className={r.errorCount ? "text-mingle-error" : ""}>{r.errorCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </>
  );
}

async function JobsTab({ db, tab, q }: { db: Db; tab: string; q: string }) {
  const jobs = await loadJobsForTab(db, tab, q);
  const back = `${BASE}?tab=${tab}`;
  return (
    <Panel
      title={`${JOB_TABS[tab]?.label ?? "Jobs"} (${jobs.length}${jobs.length === 200 ? "+" : ""})`}
      actions={
        <form className="flex gap-2">
          <input type="hidden" name="tab" value={tab} />
          <input name="q" defaultValue={q} placeholder="Title or company" className={inputClass} />
          <button type="submit" className="mingle-btn-secondary text-xs">Filter</button>
        </form>
      }
    >
      {jobs.length === 0 ? (
        <p className="text-sm text-mingle-text-secondary">Nothing here.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-mingle-border">
          {jobs.map((job) => {
            const failed = failedChecks(parseChecks(job.validation));
            return (
              <li key={job.id} className="flex flex-col gap-1.5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${BASE}/${job.id}`} className="font-semibold text-mingle-text hover:underline">
                    {job.title}
                  </Link>
                  <StatusPill status={job.status} />
                  {job.manually_edited ? <span className="text-[11px] text-mingle-text-secondary">edited</span> : null}
                </div>
                <p className="text-xs text-mingle-text-secondary">
                  {[job.company_name, job.location, job.work_model, job.category].filter(Boolean).join(" · ")} · seen{" "}
                  {when(job.last_seen_at)} · updated {when(job.updated_at)}
                </p>
                {job.status_reason ? <p className="text-xs text-mingle-text">{job.status_reason}</p> : null}
                {failed.length && job.status !== "published" ? (
                  <p className="text-xs text-mingle-error">Failed: {failed.map((c) => c.label).join(", ")}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Link href={`${BASE}/${job.id}`} className="mingle-btn-secondary text-xs">Review / edit</Link>
                  {job.status !== "published" && job.status !== "removed" ? (
                    <ActionButton action={jobAction} fields={{ jobId: job.id, op: "publish", returnTo: back }} label="Publish" tone="primary" />
                  ) : null}
                  {job.status === "published" ? (
                    <ActionButton action={jobAction} fields={{ jobId: job.id, op: "pause", returnTo: back }} label="Hide" />
                  ) : null}
                  {job.status !== "rejected" && job.status !== "removed" ? (
                    <ActionButton action={jobAction} fields={{ jobId: job.id, op: "reject", returnTo: back }} label="Reject" tone="danger" />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

const LOG_KINDS = [
  "processed", "published", "updated", "validation_failed", "ai_error", "duplicate", "expired", "paused",
  "resumed", "removed", "manual_edit", "manual_publish", "source_error", "source_blocked", "permission_blocked",
  "publishing_paused", "takedown_requested", "takedown_completed", "crawl_finished",
];

async function LogsTab({ db, kind }: { db: Db; kind: string }) {
  const events = await loadEvents(db, { kind: LOG_KINDS.includes(kind) ? kind : undefined, limit: 300 });
  return (
    <Panel
      title="AI processing & audit log"
      actions={
        <form className="flex gap-2">
          <input type="hidden" name="tab" value="logs" />
          <select name="kind" defaultValue={kind} className={inputClass}>
            <option value="">All events</option>
            {LOG_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button type="submit" className="mingle-btn-secondary text-xs">Filter</button>
        </form>
      }
    >
      <ul className="flex flex-col divide-y divide-mingle-border text-xs">
        {events.map((e) => (
          <li key={e.id} className="flex flex-col gap-0.5 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-mingle-text-secondary">{when(e.created_at)}</span>
              <span className="font-semibold text-mingle-text">{e.kind}</span>
              <span className="text-mingle-text-secondary">{e.actor}</span>
              {e.job_id ? <Link href={`${BASE}/${e.job_id}`} className="text-mingle-purple hover:underline">job</Link> : null}
            </div>
            {e.message ? <p className="text-mingle-text">{e.message}</p> : null}
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
  );
}

async function TakedownsTab({ db }: { db: Db }) {
  const rows = await loadTakedowns(db);
  return (
    <Panel title="Company removal requests">
      <p className="text-xs text-mingle-text-secondary">
        Requests from an email on the company’s recorded domain are confirmed by email and executed automatically.
        Others land here as “needs review”. Public form: /job-removal
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-mingle-text-secondary">No requests.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-mingle-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 py-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-mingle-text">{r.company_name}</span>
                <StatusPill status={r.status} />
                <span className="text-mingle-text-secondary">{when(r.created_at)}</span>
              </div>
              <p>
                {r.requester_name ? `${r.requester_name} · ` : ""}
                {r.requester_email} · {r.scope === "job" ? "one listing" : "all listings"}
                {r.job_id ? (
                  <> · <Link href={`${BASE}/${r.job_id}`} className="text-mingle-purple hover:underline">job</Link></>
                ) : null}
              </p>
              {r.reason ? <p className="text-mingle-text">“{r.reason}”</p> : null}
              {r.status === "needs_review" || r.status === "pending_verification" ? (
                <div className="flex gap-2">
                  <ActionButton action={takedownAdminAction} fields={{ takedownId: r.id, op: "complete" }} label="Verify & remove" tone="primary" />
                  <ActionButton action={takedownAdminAction} fields={{ takedownId: r.id, op: "reject" }} label="Reject" tone="danger" />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
