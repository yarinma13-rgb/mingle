import { SubmitButton } from "@/components/admin/external-jobs/SubmitButton";
import { crawlNowAction, addSourceAction, updateSourceAction } from "@/lib/external-jobs/admin-actions";
import { SOURCE_TYPE_LABELS, UNAVAILABLE_SOURCE_TYPES, type ExternalSourceRow } from "@/lib/external-jobs/types";
import { ActionButton, inputClass, Panel, StatusPill, when } from "@/components/admin/external-jobs/ui";

const BACK = "/admin/external-jobs?tab=sources";

const KEY_HELP: Record<string, string> = {
  greenhouse: "board token (boards.greenhouse.io/<token>)",
  lever: "site name (jobs.lever.co/<site>)",
  ashby: "job board name (jobs.ashbyhq.com/<name>)",
  workable: "account subdomain (apply.workable.com/<account>)",
  jsonld_sitemap: "full sitemap URL on the careers domain",
};

export function SourcesPanel({ sources }: { sources: Array<ExternalSourceRow & { publishedCount: number }> }) {
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Add an approved source">
        <form action={addSourceAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            Company name
            <input name="companyName" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Official careers URL (https)
            <input name="careersUrl" type="url" required placeholder="https://company.com/careers" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Collection method
            <select name="sourceType" className={inputClass} defaultValue="greenhouse">
              {Object.entries(SOURCE_TYPE_LABELS)
                .filter(([value]) => !UNAVAILABLE_SOURCE_TYPES.includes(value as ExternalSourceRow["source_type"]))
                .map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Source key
            <input name="sourceKey" required className={inputClass} placeholder="e.g. acme" />
            <span className="text-[11px] text-mingle-text-secondary">
              {Object.entries(KEY_HELP).map(([k, v]) => `${k}: ${v}`).join(" · ")}
            </span>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Legal basis for collection
            <select name="collectionBasis" className={inputClass} defaultValue="public_api">
              <option value="public_api">Public job-board API published by the ATS for this purpose</option>
              <option value="public_feed">Public job feed published by the company</option>
              <option value="structured_data">schema.org JobPosting published for aggregators</option>
              <option value="written_permission">Written permission from the company</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Company email domains (for takedown verification, comma separated)
            <input name="companyDomains" className={inputClass} placeholder="company.com" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Extra allowed apply-link hosts (optional)
            <input name="allowedApplyHosts" className={inputClass} placeholder="careers.company.com" />
          </label>
          <label className="flex flex-col gap-1 text-xs sm:col-span-2">
            Terms / permission notes (what you checked, links, contacts)
            <textarea name="permissionNotes" rows={2} className={inputClass} />
          </label>
          <label className="flex items-start gap-2 text-xs sm:col-span-2">
            <input type="checkbox" name="termsConfirmed" required className="mt-0.5" />
            I reviewed this source’s terms of use and robots.txt: they allow automated collection by this method and
            displaying a reworded summary that links back to the official application page. (Recorded with your
            email and the time.)
          </label>
          <div className="sm:col-span-2">
            <SubmitButton className="mingle-btn-primary text-xs" pendingLabel="Adding…">Add source</SubmitButton>
          </div>
        </form>
      </Panel>

      <Panel
        title={`Sources (${sources.length})`}
        actions={<ActionButton action={crawlNowAction} fields={{ returnTo: BACK }} label="Crawl all due sources now" pendingLabel="Crawling… (up to a minute)" />}
      >
        {sources.length === 0 ? (
          <p className="text-sm text-mingle-text-secondary">No sources yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-mingle-border">
            {sources.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-mingle-text">{s.company_name}</span>
                  <StatusPill status={s.status} />
                  {s.publishing_paused ? <StatusPill status="paused" /> : null}
                  <span className="text-xs text-mingle-text-secondary">
                    {SOURCE_TYPE_LABELS[s.source_type]} · {s.source_key} · {s.publishedCount} published
                  </span>
                </div>
                <p className="text-xs text-mingle-text-secondary">
                  Last crawl {when(s.last_crawled_at)} · last success {when(s.last_success_at)} · every{" "}
                  {s.crawl_interval_hours}h · ≥{s.min_request_interval_ms}ms between requests · robots{" "}
                  {s.robots_allowed == null ? "not checked" : s.robots_allowed ? "allows" : "DISALLOWS"} · terms reviewed{" "}
                  {when(s.terms_reviewed_at)} by {s.terms_reviewed_by ?? "—"} ({s.collection_basis})
                </p>
                {s.last_error ? (
                  <p className="text-xs text-mingle-error">
                    {s.consecutive_failures}× failing: {s.last_error}
                  </p>
                ) : null}
                {s.publishing_paused_reason ? (
                  <p className="text-xs text-mingle-text">Publishing paused: {s.publishing_paused_reason}</p>
                ) : null}
                {s.status !== "removed" ? (
                  <div className="flex flex-wrap gap-2">
                    {s.status === "active" ? (
                      <>
                        <ActionButton action={crawlNowAction} fields={{ sourceId: s.id, returnTo: BACK }} label="Crawl now" pendingLabel="Crawling… (up to a minute)" />
                        <ActionButton action={updateSourceAction} fields={{ sourceId: s.id, op: "pause", returnTo: BACK }} label="Pause crawling" />
                      </>
                    ) : (
                      <ActionButton action={updateSourceAction} fields={{ sourceId: s.id, op: "resume", returnTo: BACK }} label="Resume crawling" />
                    )}
                    {s.publishing_paused ? (
                      <ActionButton action={updateSourceAction} fields={{ sourceId: s.id, op: "resume_publishing", returnTo: BACK }} label="Resume auto-publish" />
                    ) : (
                      <ActionButton action={updateSourceAction} fields={{ sourceId: s.id, op: "pause_publishing", returnTo: BACK }} label="Pause auto-publish" />
                    )}
                    <ActionButton
                      action={updateSourceAction}
                      fields={{ sourceId: s.id, op: "remove", returnTo: BACK }}
                      label="Remove source + its jobs"
                      tone="danger"
                    />
                  </div>
                ) : null}
                <details className="text-xs">
                  <summary className="cursor-pointer text-mingle-text-secondary">Edit settings</summary>
                  <form action={updateSourceAction} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input type="hidden" name="sourceId" value={s.id} />
                    <input type="hidden" name="op" value="save" />
                    <input type="hidden" name="returnTo" value={BACK} />
                    <label className="flex flex-col gap-1">
                      Crawl interval (hours)
                      <input name="crawlIntervalHours" type="number" min={1} defaultValue={s.crawl_interval_hours} className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-1">
                      Min ms between requests (rate limit)
                      <input name="minRequestIntervalMs" type="number" min={250} defaultValue={s.min_request_interval_ms} className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-1">
                      Company email domains
                      <input name="companyDomains" defaultValue={s.company_domains.join(", ")} className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-1">
                      Extra apply hosts
                      <input name="allowedApplyHosts" defaultValue={s.allowed_apply_hosts.join(", ")} className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      Permission notes
                      <textarea name="permissionNotes" rows={2} defaultValue={s.permission_notes ?? ""} className={inputClass} />
                    </label>
                    <div>
                      <SubmitButton className="mingle-btn-secondary text-xs" pendingLabel="Saving…">Save</SubmitButton>
                    </div>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
