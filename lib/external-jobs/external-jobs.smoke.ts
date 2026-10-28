/**
 * Smoke checks for the External Opportunities engine (no test runner in package.json).
 * Run: npx --yes tsx lib/external-jobs/external-jobs.smoke.ts
 * Network is mocked; nothing leaves the machine.
 */
import { greenhouse, lever } from "@/lib/external-jobs/connectors/ats";
import { extractJobPostings, postingToRawJob, sitemapLocations } from "@/lib/external-jobs/connectors/jsonld";
import { PoliteFetcher, SourceAccessDenied, SourceTransientError } from "@/lib/external-jobs/http";
import { recommendJob } from "@/lib/external-jobs/recommend";
import { parseRobots } from "@/lib/external-jobs/robots";
import { supportedTags } from "@/lib/external-jobs/pipeline";
import {
  analyzeCopying,
  impliesPartnership,
  inventedTermsClaims,
  jobFingerprint,
  unsupportedNumbers,
} from "@/lib/external-jobs/text";
import type { ExternalSourceRow, ProcessedJob, RawJob } from "@/lib/external-jobs/types";
import { failedChecks, validateJob } from "@/lib/external-jobs/validate";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const SOURCE: ExternalSourceRow = {
  id: "00000000-0000-0000-0000-000000000001",
  company_name: "Acme",
  careers_url: "https://acme.com/careers",
  source_type: "greenhouse",
  source_key: "acme",
  collection_basis: "public_api",
  terms_reviewed_at: "2026-10-01T00:00:00Z",
  terms_reviewed_by: "admin@mingle.careers",
  permission_notes: null,
  allowed_apply_hosts: [],
  company_domains: ["acme.com"],
  logo_url: null,
  logo_permission: false,
  is_official_partner: false,
  status: "active",
  publishing_paused: false,
  publishing_paused_reason: null,
  crawl_interval_hours: 24,
  min_request_interval_ms: 250,
  robots_allowed: true,
  robots_checked_at: null,
  last_crawled_at: null,
  last_success_at: null,
  last_error: null,
  consecutive_failures: 0,
  created_by: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

const SOURCE_TEXT = `We are looking for a Backend Engineer to join the payments platform team in Tel Aviv.
You will design and operate high-throughput services that move money for millions of merchants every day.
Requirements:
• 4+ years of experience building backend services in Node.js or Go
• Hands-on experience with PostgreSQL and Kafka
• Experience running services on Kubernetes in production
Advantages:
• Experience in fintech or payments
The role is hybrid, three days a week in our Tel Aviv office.`;

const RAW: RawJob = {
  externalId: "123",
  title: "Backend Engineer",
  companyName: "Acme",
  location: "Tel Aviv, Israel",
  workModelHint: "Hybrid",
  employmentTypeHint: null,
  department: "Engineering",
  text: SOURCE_TEXT,
  applyUrl: "https://boards.greenhouse.io/acme/jobs/123",
  sourceUrl: "https://boards.greenhouse.io/acme/jobs/123",
  postedAt: null,
  updatedAt: null,
  payload: null,
};

const GOOD: ProcessedJob = {
  companyName: "Acme",
  title: "Backend Engineer",
  location: "Tel Aviv, Israel",
  workModel: "Hybrid",
  employmentType: null,
  seniority: null,
  department: "Engineering",
  category: "Engineering",
  sourceLanguage: "en",
  summary:
    "Build and run the large-scale services behind Acme's payments platform, which processes transactions for a very large merchant base.",
  responsibilities: ["Design high-volume payment services", "Operate them in production"],
  requirements: ["4+ years in backend development with Node.js or Go", "PostgreSQL and Kafka experience", "Production Kubernetes experience"],
  niceToHave: ["Fintech or payments background"],
  tags: ["Node.js", "Go", "PostgreSQL", "Kafka", "Kubernetes"],
};

const OK_LINK = { ok: true, gone: false, detail: "ok" };
const NO_DUP = { duplicate: false, detail: "none" };
const CLEAN_FACTS = { unsupportedClaims: [], missingKeyRequirements: [], misleading: [] };

async function run() {
  // --- robots.txt ---------------------------------------------------------
  const robots = parseRobots(
    `User-agent: *\nDisallow: /private\nAllow: /private/jobs\n\nUser-agent: BadBot\nDisallow: /\n`,
    "minglejobsbot",
  );
  expect(robots.isAllowed("/careers"), "robots: /careers allowed");
  expect(!robots.isAllowed("/private/x"), "robots: /private disallowed");
  expect(robots.isAllowed("/private/jobs/1"), "robots: longer Allow wins");
  const specific = parseRobots(`User-agent: *\nAllow: /\n\nUser-agent: MingleJobsBot\nDisallow: /\nCrawl-delay: 5`, "minglejobsbot");
  expect(!specific.isAllowed("/jobs"), "robots: specific group applies to us");
  expect(specific.crawlDelay === 5, "robots: crawl-delay parsed");
  expect(!parseRobots("User-agent: *\nDisallow: /*.json$", "x").isAllowed("/a/b.json"), "robots: wildcard + $");

  // --- fingerprints -------------------------------------------------------
  expect(
    jobFingerprint({ companyName: "Acme Ltd.", title: "Backend Engineer (m/f/d)", location: "Tel Aviv, Israel" }) ===
      jobFingerprint({ companyName: "acme", title: "Backend  Engineer", location: "Tel Aviv-Yafo" }) ||
      jobFingerprint({ companyName: "Acme Ltd.", title: "Backend Engineer (m/f/d)", location: "Tel Aviv" }) ===
        jobFingerprint({ companyName: "acme", title: "Backend  Engineer", location: "Tel Aviv" }),
    "fingerprint: normalizes company suffixes and gender markers",
  );
  expect(
    jobFingerprint({ companyName: "Acme", title: "Backend Engineer", location: null }) !==
      jobFingerprint({ companyName: "Acme", title: "Frontend Engineer", location: null }),
    "fingerprint: different titles differ",
  );

  // --- copy / invention detection ----------------------------------------
  const copied = analyzeCopying(SOURCE_TEXT, SOURCE_TEXT);
  expect(copied.shingleOverlap > 0.9 && copied.longestCopiedRun > 50, "copy: verbatim detected");
  const rewritten = analyzeCopying(SOURCE_TEXT, [GOOD.summary, ...GOOD.requirements].join(" "));
  expect(rewritten.shingleOverlap < 0.2 && rewritten.longestCopiedRun < 15, `copy: rewrite passes ${JSON.stringify(rewritten)}`);
  expect(unsupportedNumbers(SOURCE_TEXT, "Requires 7+ years").includes("7"), "numbers: invented 7 caught");
  expect(unsupportedNumbers(SOURCE_TEXT, "Requires 4+ years").length === 0, "numbers: sourced 4 ok");
  expect(inventedTermsClaims(SOURCE_TEXT, "Competitive salary and great benefits").length === 2, "terms: salary+benefits caught");
  expect(impliesPartnership("Apply via mingle today"), "partnership phrase caught");
  expect(impliesPartnership("Acme is an official partner of mingle"), "partnership: official partner of mingle");
  expect(impliesPartnership("המשרה בשיתוף mingle"), "partnership: Hebrew claim caught");
  expect(!impliesPartnership("You will partner with Product. Acme is an official AWS partner."), "partnership: ordinary wording ok");
  expect(inventedTermsClaims("דרוש מפתח צד שרת", "שכר תחרותי וקרן השתלמות").length === 2, "terms: Hebrew salary+benefits caught");
  expect(inventedTermsClaims("שכר גבוה והטבות", "שכר תחרותי והטבות").length === 0, "terms: Hebrew sourced terms ok");

  // --- tags ---------------------------------------------------------------
  const tags = supportedTags(["Kafka", "Rust", "Kubernetes", "Payments"], RAW, "Engineering");
  expect(tags.includes("Kafka") && tags.includes("Kubernetes") && !tags.includes("Rust"), `tags: ${tags}`);

  // --- validation gate ----------------------------------------------------
  const pass = validateJob({ source: SOURCE, raw: RAW, processed: GOOD, factCheck: CLEAN_FACTS, link: OK_LINK, duplicate: NO_DUP });
  expect(failedChecks(pass).length === 0, `validate: good job passes: ${JSON.stringify(failedChecks(pass))}`);
  expect(pass.length === 8, "validate: all 8 mandatory checks run");

  const fail = (patch: Partial<Parameters<typeof validateJob>[0]>, id: string) => {
    const checks = validateJob({ source: SOURCE, raw: RAW, processed: GOOD, factCheck: CLEAN_FACTS, link: OK_LINK, duplicate: NO_DUP, ...patch });
    expect(failedChecks(checks).some((c) => c.id === id), `validate: expected ${id} to fail`);
  };
  fail({ factCheck: null }, "faithful");
  fail({ factCheck: { ...CLEAN_FACTS, unsupportedClaims: ["Says remote"] } }, "faithful");
  fail({ processed: { ...GOOD, requirements: [...GOOD.requirements, "10 years of Go"] } }, "faithful");
  fail({ processed: { ...GOOD, summary: GOOD.summary + " Competitive salary." } }, "faithful");
  fail({ processed: { ...GOOD, summary: SOURCE_TEXT } }, "original_wording");
  fail({ processed: { ...GOOD, requirements: [] } }, "complete");
  fail({ duplicate: { duplicate: true, detail: "dup" } }, "no_duplicate");
  fail({ link: { ok: false, gone: true, detail: "404" } }, "job_open");
  fail({ raw: { ...RAW, applyUrl: "https://evil.example/apply" } }, "apply_link");
  fail({ raw: { ...RAW, applyUrl: "http://boards.greenhouse.io/acme/jobs/123" } }, "apply_link");
  fail({ source: { ...SOURCE, terms_reviewed_at: null } }, "source_permitted");
  fail({ source: { ...SOURCE, robots_allowed: false } }, "source_permitted");
  fail({ processed: { ...GOOD, summary: GOOD.summary + " Hiring on mingle now." } }, "not_misleading");
  const partnerWording = validateJob({
    source: SOURCE, raw: RAW, factCheck: CLEAN_FACTS, link: OK_LINK, duplicate: NO_DUP,
    processed: { ...GOOD, summary: GOOD.summary + " You will partner closely with product managers." },
  });
  expect(!failedChecks(partnerWording).some((c) => c.id === "not_misleading"), "validate: 'partner with' is not misleading");

  // --- JSON-LD + sitemap --------------------------------------------------
  const page = `<html><head><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Acme" },
      {
        "@type": "JobPosting",
        title: "Data Analyst",
        description: "<p>Analyze product data with SQL.</p>",
        identifier: { "@type": "PropertyValue", value: "DA-9" },
        hiringOrganization: { name: "Acme" },
        jobLocation: { address: { addressLocality: "Haifa", addressCountry: "IL" } },
        employmentType: "FULL_TIME",
        validThrough: "2999-01-01",
      },
    ],
  })}</script></head></html>`;
  const postings = extractJobPostings(page);
  expect(postings.length === 1, "jsonld: posting found in @graph");
  const rawJob = postingToRawJob(postings[0], "https://acme.com/careers/da-9", "Acme");
  expect(rawJob?.externalId === "DA-9" && rawJob.location === "Haifa, IL" && rawJob.employmentTypeHint === "full_time", `jsonld: ${JSON.stringify(rawJob)}`);
  expect(postingToRawJob({ ...postings[0], validThrough: "2001-01-01" }, "https://acme.com/x", "Acme") === null, "jsonld: expired posting skipped");
  const sm = sitemapLocations("<urlset><url><loc>https://acme.com/careers/a</loc></url><url><loc>https://acme.com/careers/b?x=1&amp;y=2</loc></url></urlset>");
  expect(sm.urls.length === 2 && sm.urls[1].includes("&y=2"), "sitemap: urls + entities");

  // --- recommendations ----------------------------------------------------
  const rec = recommendJob(
    { skills: ["node", "Kubernetes", "postgres"], targetRole: "Backend Engineer", currentTitle: null, workStyle: ["Hybrid"], location: "Tel Aviv" },
    { title: GOOD.title, tags: GOOD.tags, location: GOOD.location, workModel: GOOD.workModel },
  );
  expect(rec.score >= 60 && rec.reasons.length >= 3, `recommend: ${JSON.stringify(rec)}`);

  // --- HTTP politeness (mocked fetch) -------------------------------------
  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  let flaky = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    const ua = new Headers(init?.headers).get("user-agent") ?? "";
    expect(ua.startsWith("MingleJobsBot"), "http: identifies itself");
    if (url === "https://dead.test/robots.txt") throw new TypeError("fetch failed");
    if (url === "https://down.test/robots.txt") return new Response("oops", { status: 503 });
    if (url.endsWith("/robots.txt")) {
      return new Response(url.includes("blocked.test") ? "User-agent: *\nDisallow: /" : "User-agent: *\nAllow: /", { status: 200 });
    }
    if (url.includes("/redir-bad")) return new Response(null, { status: 302, headers: { location: "https://blocked.test/private" } });
    if (url.includes("/redir-ok")) return new Response(null, { status: 301, headers: { location: "/landed" } });
    if (url.includes("/forbidden")) return new Response("no", { status: 403 });
    if (url.includes("/captcha")) {
      return new Response("<html>Checking your browser before accessing</html>", { status: 200, headers: { "content-type": "text/html" } });
    }
    if (url.includes("/flaky")) {
      flaky += 1;
      if (flaky < 2) return new Response("busy", { status: 503, headers: { "retry-after": "0" } });
    }
    if (url.includes("boards-api.greenhouse.io")) {
      return Response.json({
        jobs: [{ id: 7, title: "Backend Engineer", absolute_url: "https://boards.greenhouse.io/acme/jobs/7", content: "&lt;p&gt;Remote role building &lt;b&gt;APIs&lt;/b&gt;&lt;/p&gt;", location: { name: "Remote - Israel" }, updated_at: "2026-10-20T10:00:00Z" }],
      });
    }
    if (url.includes("api.lever.co")) {
      return Response.json([{ id: "abc", text: "Designer", hostedUrl: "https://jobs.lever.co/acme/abc", applyUrl: "https://jobs.lever.co/acme/abc/apply", workplaceType: "hybrid", descriptionPlain: "Design things.", lists: [{ text: "Requirements", content: "<li>Figma</li>" }], categories: { location: "Tel Aviv", commitment: "Full-time" } }]);
    }
    return Response.json({ ok: true });
  }) as typeof fetch;

  try {
    const fetcher = new PoliteFetcher({ minIntervalMs: 250 });
    await fetcher.get("https://blocked.test/jobs").then(
      () => expect(false, "http: robots-disallowed request must throw"),
      (e) => expect(e instanceof SourceAccessDenied && e.reason === "robots", "http: robots blocks"),
    );
    for (const host of ["dead.test", "down.test"]) {
      const status = await fetcher.robotsStatus(`https://${host}/jobs`);
      expect(status.state === "unreachable", `http: ${host} robots is unreachable, not disallowed`);
      await fetcher.get(`https://${host}/jobs`).then(
        () => expect(false, `http: ${host} must not be fetched without robots.txt`),
        (e) => expect(e instanceof SourceTransientError, `http: ${host} outage is transient, not a ban`),
      );
    }
    expect((await fetcher.robotsStatus("https://blocked.test/x")).state === "disallowed", "http: real disallow reported");
    expect(!calls.some((c) => c.startsWith("https://dead.test/jobs") || c.startsWith("https://down.test/jobs")), "http: nothing fetched past unreadable robots");
    await fetcher.get("https://ok.test/forbidden").then(
      () => expect(false, "http: 403 must throw"),
      (e) => expect(e instanceof SourceAccessDenied && e.reason === "forbidden", "http: 403 not bypassed"),
    );
    expect(calls.filter((c) => c.includes("/forbidden")).length === 1, "http: 403 never retried");
    await fetcher.get("https://ok.test/captcha").then(
      () => expect(false, "http: captcha must throw"),
      (e) => expect(e instanceof SourceAccessDenied && e.reason === "challenge", "http: captcha not bypassed"),
    );
    const flakyResult = await fetcher.get("https://ok.test/flaky");
    expect(flakyResult.status === 200 && flaky === 2, "http: transient 503 retried");

    await fetcher.get("https://ok.test/redir-bad").then(
      () => expect(false, "http: redirect into a robots-disallowed page must throw"),
      (e) => expect(e instanceof SourceAccessDenied && e.reason === "robots", "http: robots checked on redirect target"),
    );
    expect(!calls.includes("https://blocked.test/private"), "http: disallowed redirect target never requested");
    const landed = await fetcher.get("https://ok.test/redir-ok");
    expect(landed.url === "https://ok.test/landed", `http: redirect followed to ${landed.url}`);
    expect(new PoliteFetcher({ minIntervalMs: 250, deadline: Date.now() - 1 }).outOfTime(), "http: deadline reported");

    const t0 = Date.now();
    await fetcher.get("https://ok.test/a");
    await fetcher.get("https://ok.test/b");
    expect(Date.now() - t0 >= 240, "http: per-host rate limit spaces requests");

    const gh = await greenhouse.list(SOURCE, fetcher);
    expect(gh.complete && gh.jobs[0].text.includes("building APIs") && gh.jobs[0].workModelHint === "Remote", `greenhouse: ${JSON.stringify(gh.jobs[0])}`);
    const lv = await lever.list({ ...SOURCE, source_type: "lever" }, fetcher);
    expect(lv.jobs[0].workModelHint === "Hybrid" && lv.jobs[0].employmentTypeHint === "full_time" && lv.jobs[0].text.includes("Figma"), `lever: ${JSON.stringify(lv.jobs[0])}`);
  } finally {
    globalThis.fetch = realFetch;
  }

  console.log("external-jobs smoke: OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
