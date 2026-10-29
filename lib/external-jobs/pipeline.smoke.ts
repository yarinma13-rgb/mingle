/**
 * End-to-end smoke test of the crawl pipeline: in-memory database, mocked
 * Ashby board, apply pages and Gemini. Nothing leaves the machine.
 * Run: npx --yes tsx lib/external-jobs/pipeline.smoke.ts
 */
import { runExternalJobsCrawl } from "@/lib/external-jobs/pipeline";
import type { AdminDb } from "@/lib/external-jobs/store";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// --- Minimal PostgREST-like fake ---------------------------------------------
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
let idSeq = 0;
const KEYS: Record<string, string> = { external_job_snapshots: "job_id", external_jobs_settings: "id" };

class Query {
  private filters: Array<(r: Row) => boolean> = [];
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private singleMode = false;
  private limitN: number | null = null;
  constructor(private table: string) {
    tables[table] ??= [];
  }
  select() { return this; }
  insert(p: Row | Row[]) { this.op = "insert"; this.payload = p; return this; }
  update(p: Row) { this.op = "update"; this.payload = p; return this; }
  upsert(p: Row | Row[]) { this.op = "upsert"; this.payload = p; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: unknown) { this.filters.push((r) => r[c] !== v); return this; }
  in(c: string, v: unknown[]) { this.filters.push((r) => v.includes(r[c])); return this; }
  is(c: string, v: null) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
  gte(c: string, v: string) { this.filters.push((r) => String(r[c]) >= v); return this; }
  ilike(c: string, v: string) { this.filters.push((r) => String(r[c] ?? "").toLowerCase() === v.toLowerCase()); return this; }
  order() { return this; }
  limit(n: number) { this.limitN = n; return this; }
  maybeSingle() { this.singleMode = true; return this; }
  single() { this.singleMode = true; return this; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then(resolve: any, reject?: any) { return Promise.resolve(this.run()).then(resolve, reject); }
  private run() {
    const rows = tables[this.table];
    const now = new Date().toISOString();
    let result: Row[] = [];
    if (this.op === "insert" || this.op === "upsert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload!];
      for (const item of list) {
        const key = KEYS[this.table] ?? "id";
        const found = this.op === "upsert" ? rows.find((r) => r[key] === item[key]) : undefined;
        if (found) { Object.assign(found, item); result.push(found); continue; }
        const row: Row = { id: `id-${++idSeq}`, created_at: now, updated_at: now, first_seen_at: now, last_seen_at: now,
          started_at: now, finished_at: null, verify_failures: 0, manually_edited: false, published_at: null,
          responsibilities: [], requirements: [], nice_to_have: [], tags: [], stats: {}, errors: [], ...item };
        rows.push(row);
        result.push(row);
      }
    } else {
      result = rows.filter((r) => this.filters.every((f) => f(r)));
      if (this.op === "update") result.forEach((r) => Object.assign(r, this.payload, { updated_at: now }));
      if (this.op === "delete") tables[this.table] = rows.filter((r) => !result.includes(r));
    }
    if (this.limitN != null) result = result.slice(0, this.limitN);
    if (this.singleMode) return { data: result[0] ?? null, error: null };
    return { data: result, error: null };
  }
}
const fakeDb = { from: (t: string) => new Query(t) } as unknown as AdminDb;

// --- Fixtures -----------------------------------------------------------------
const JOBS = 12;
const ashbyJobs = Array.from({ length: JOBS }, (_, i) => ({
  id: `job-${i}`,
  title: i === 0 ? "Backend Engineer" : `Product Designer ${i}`,
  location: "Tel Aviv",
  department: "Engineering",
  workplaceType: "Hybrid",
  employmentType: "FullTime",
  isListed: true,
  descriptionPlain: `We are hiring a ${i === 0 ? "Backend Engineer" : "Product Designer"} to build the core platform for our payments product used by many merchants every day.\nRequirements:\n• 4+ years of experience with Node.js or Figma\n• Strong communication skills and ownership\n• Experience working closely with cross-functional teams`,
  jobUrl: `https://jobs.ashbyhq.com/acme/job-${i}`,
  applyUrl: `https://jobs.ashbyhq.com/acme/job-${i}/application`,
  publishedAt: "2026-10-01T00:00:00Z",
}));

tables.external_jobs_settings = [{ id: true, crawling_enabled: true, auto_publish_enabled: true }];
tables.external_job_sources = [{
  id: "src-1", company_name: "Acme", careers_url: "https://acme.com/careers", source_type: "ashby", source_key: "acme",
  collection_basis: "public_api", terms_reviewed_at: "2026-10-01T00:00:00Z", terms_reviewed_by: "admin", permission_notes: null,
  allowed_apply_hosts: [], company_domains: ["acme.com"], logo_url: null, logo_permission: false, is_official_partner: false,
  status: "active", publishing_paused: false, publishing_paused_reason: null, crawl_interval_hours: 24,
  min_request_interval_ms: 250, robots_allowed: null, robots_checked_at: null, last_crawled_at: null, last_success_at: null,
  last_error: null, consecutive_failures: 0, created_by: null, created_at: "", updated_at: "",
}];
tables.company_profiles = [];
tables.roles = [];

let geminiCalls = 0;
let geminiDown = false;
let quotaHitsLeft = 0;
let primaryOutForTheDay = false;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /");
  if (url.includes("api.ashbyhq.com/posting-api")) return Response.json({ jobs: ashbyJobs });
  if (url.includes("jobs.ashbyhq.com")) {
    const id = url.match(/job-\d+/)?.[0];
    const job = ashbyJobs.find((j) => j.id === id);
    return new Response(`<html><title>${job?.title}</title></html>`, { headers: { "content-type": "text/html" } });
  }
  if (url.includes("generativelanguage.googleapis.com")) {
    geminiCalls += 1;
    if (geminiDown) return Response.json({ error: { message: "models/x is not found" } }, { status: 404 });
    if (primaryOutForTheDay && url.includes("/models/gemini-3.6-flash:")) {
      return Response.json(
        { error: { status: "RESOURCE_EXHAUSTED", message: "Quota exceeded for metric: generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash, description: Generate content requests per day limit exceeded on Free Tier." } },
        { status: 429 },
      );
    }
    if (quotaHitsLeft > 0) {
      quotaHitsLeft -= 1;
      return Response.json(
        { error: { status: "RESOURCE_EXHAUSTED", message: "You exceeded your current quota. Quota exceeded for metric: generate_content_free_tier_requests, limit: 600, model: x, description: Generate content requests per minute limit exceeded on Free Tier." } },
        { status: 429 },
      );
    }
    await new Promise((r) => setTimeout(r, 30));
    const body = JSON.parse(String(init?.body));
    const isFactCheck = String(body.systemInstruction.parts[0].text).includes("fact-checker");
    const user: string = body.contents[0].parts[0].text;
    const isBackend = user.includes("Backend Engineer");
    const out = isFactCheck
      ? { unsupportedClaims: [], missingKeyRequirements: [], misleading: [] }
      : {
          location: "Tel Aviv", workModel: "Hybrid", employmentType: "full_time", seniority: null,
          department: "Engineering", category: isBackend ? "Engineering" : "Design", sourceLanguage: "en",
          summary: isBackend
            ? "Design and run the central services behind a merchant payments product, owning reliability and scale."
            : "Shape the experience of a merchant payments product, from research through polished interface design.",
          responsibilities: ["Own core platform work end to end"],
          requirements: ["4+ years with Node.js or Figma", "Clear communication and ownership", "Cross-functional collaboration"],
          niceToHave: [],
          tags: isBackend ? ["Node.js"] : ["Figma"],
        };
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] });
  }
  return new Response("not found", { status: 404 });
}) as typeof fetch;
process.env.GEMINI_API_KEY = "test";

async function run() {
  // 1. AI down: nothing published, source NOT paused, jobs queued for retry.
  geminiDown = true;
  let summary = await runExternalJobsCrawl({ trigger: "manual", db: fakeDb });
  const afterDown = tables.external_jobs;
  expect(afterDown.length === JOBS, `inserted ${afterDown.length}`);
  expect(summary.stats.discovered === JOBS, `discovered ${summary.stats.discovered}`);
  expect(!afterDown.some((j) => j.status === "published"), "nothing published while AI is down");
  expect(summary.stats.aiErrors >= 3 && summary.stats.aiErrors <= 3 + 4, `stops after a few AI errors: ${summary.stats.aiErrors}`);
  expect(tables.external_job_sources[0].publishing_paused === false, "AI outage does not pause the source");
  expect(tables.external_crawl_runs.every((r) => r.finished_at), "run finished");
  expect(tables.external_job_snapshots.length === JOBS, "snapshots stored in bulk");

  // 2. AI back: a new run (source not due, so target it) processes everything.
  geminiDown = false;
  geminiCalls = 0;
  const t0 = Date.now();
  summary = await runExternalJobsCrawl({ trigger: "manual", sourceId: "src-1", db: fakeDb });
  const published = tables.external_jobs.filter((j) => j.status === "published");
  expect(published.length === JOBS, `all published after recovery: ${published.length} (${JSON.stringify(tables.external_jobs.filter((j) => j.status !== "published").map((j) => j.status_reason))})`);
  expect(geminiCalls === JOBS * 2, `two AI calls per job: ${geminiCalls}`);
  expect(summary.stats.discovered === 0, "no duplicates inserted on second run");
  const run2 = tables.external_crawl_runs.at(-1)!;
  expect(run2.finished_at && (run2.stats as Record<string, number>).published === JOBS, "run stats saved");
  console.log(`  processed ${JOBS} jobs with 4 parallel workers in ${Date.now() - t0}ms`);

  // 3. Unchanged third run: no AI calls, nothing reprocessed.
  geminiCalls = 0;
  await runExternalJobsCrawl({ trigger: "manual", sourceId: "src-1", db: fakeDb });
  expect(geminiCalls === 0, `unchanged jobs are not reprocessed: ${geminiCalls}`);

  // 4. A job disappears from the complete feed: hidden, then expired after repeated misses.
  ashbyJobs.pop();
  for (let i = 0; i < 3; i++) await runExternalJobsCrawl({ trigger: "manual", sourceId: "src-1", db: fakeDb });
  const gone = tables.external_jobs.find((j) => j.external_id === `job-${JOBS - 1}`)!;
  expect(gone.status === "expired", `missing job expired: ${gone.status} / ${gone.status_reason}`);

  // 5. Run lock: an unfinished recent run blocks a new one.
  tables.external_crawl_runs.push({ id: "lock", started_at: new Date().toISOString(), finished_at: null, stats: {}, errors: [] });
  summary = await runExternalJobsCrawl({ trigger: "manual", sourceId: "src-1", db: fakeDb });
  expect(summary.skipped?.includes("already running"), "concurrent run blocked");

  // 6. Free-tier per-minute quota: learn the limit, pace, and still publish.
  tables.external_crawl_runs = tables.external_crawl_runs.filter((r) => r.id !== "lock");
  ashbyJobs.push({ ...ashbyJobs[1], id: "job-quota", title: "Product Designer quota", jobUrl: "https://jobs.ashbyhq.com/acme/job-quota", applyUrl: "https://jobs.ashbyhq.com/acme/job-quota/application" });
  quotaHitsLeft = 3; // the client retries twice itself, then pacing retries once more
  summary = await runExternalJobsCrawl({ trigger: "manual", sourceId: "src-1", db: fakeDb });
  const quotaJob = tables.external_jobs.find((j) => j.external_id === "job-quota")!;
  expect(quotaJob.status === "published", `quota-limited job published: ${quotaJob.status} / ${quotaJob.status_reason}`);
  expect(summary.stats.aiErrors === 0, `quota handled without AI errors: ${summary.stats.aiErrors}`);

  // 7. Primary model out of daily quota: fall back to the next model.
  primaryOutForTheDay = true;
  ashbyJobs.push({ ...ashbyJobs[1], id: "job-fallback", title: "Product Designer fallback", jobUrl: "https://jobs.ashbyhq.com/acme/job-fallback", applyUrl: "https://jobs.ashbyhq.com/acme/job-fallback/application" });
  summary = await runExternalJobsCrawl({ trigger: "manual", sourceId: "src-1", db: fakeDb });
  const fallbackJob = tables.external_jobs.find((j) => j.external_id === "job-fallback")!;
  expect(fallbackJob.status === "published", `fallback job published: ${fallbackJob.status} / ${fallbackJob.status_reason}`);
  expect(fallbackJob.ai_model === "gemini-2.5-flash", `processed by fallback model: ${fallbackJob.ai_model}`);
  expect(summary.stats.aiErrors === 0, `fallback without AI errors: ${summary.stats.aiErrors}`);

  console.log("pipeline smoke: OK");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    globalThis.fetch = realFetch;
  });
