/**
 * Local parser smoke checks (no test runner in package.json).
 * Run: npx --yes tsx lib/roles/job-board-import.smoke.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertImportableJobBoardUrl,
  JobBoardImportError,
  parseJobBoardHtml,
  parsedJdToRoleDraft,
} from "@/lib/roles/job-board-import";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "__fixtures__");

function load(name: string) {
  return readFileSync(join(fixtures, name), "utf8");
}

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  const alljobs = parseJobBoardHtml(
    load("alljobs-sample.html"),
    "https://www.alljobs.co.il/Search/UploadSingle.aspx?JobID=8674747",
    "alljobs",
  );
  expect(alljobs.title.includes("Full Stack"), `alljobs title: ${alljobs.title}`);
  expect(
    /Angular|Node/i.test(alljobs.rawText),
    "alljobs rawText should include skills",
  );
  expect(alljobs.requirements.length > 0, "alljobs requirements");

  const drushim = parseJobBoardHtml(
    load("drushim-sample.html"),
    "https://www.drushim.co.il/job/38331553/fc22141d/",
    "drushim",
  );
  expect(drushim.title.includes("מוצר"), `drushim title: ${drushim.title}`);
  expect(drushim.requirements.includes("React"), "drushim requirements");

  const jobmaster = parseJobBoardHtml(
    load("jobmaster-sample.html"),
    "https://www.jobmaster.co.il/jobs/checknum.asp?key=9867756",
    "jobmaster",
  );
  expect(jobmaster.title.toLowerCase().includes("magic"), "jobmaster title");
  expect(
    jobmaster.description.includes("Angular"),
    "jobmaster description",
  );
  expect(jobmaster.requirements.includes("REST"), "jobmaster requirements");

  const draft = parsedJdToRoleDraft(jobmaster);
  expect(draft.sourceUrl.includes("jobmaster"), "sourceUrl stored");
  expect(draft.sourceJd.length > 20, "sourceJd stored");

  try {
    assertImportableJobBoardUrl("https://www.linkedin.com/jobs/view/123");
    throw new Error("linkedin should be rejected");
  } catch (caught) {
    expect(
      caught instanceof JobBoardImportError && caught.code === "linkedin",
      "linkedin error code",
    );
  }

  try {
    assertImportableJobBoardUrl("https://example.com/job/1");
    throw new Error("unknown host should be rejected");
  } catch (caught) {
    expect(
      caught instanceof JobBoardImportError &&
        caught.code === "unsupported_host",
      "unsupported_host error code",
    );
  }

  for (const url of [
    "https://www.alljobs.co.il/Search/UploadSingle.aspx?JobID=1",
    "https://m.alljobs.co.il/Search/UploadSingle.aspx?JobID=1",
    "https://www.drushim.co.il/job/1/abc/",
    "https://drushim.co.il/job/1/abc/",
    "https://www.jobmaster.co.il/jobs/checknum.asp?key=1",
    "https://jobmaster.co.il/jobs/checknum.asp?key=1",
  ]) {
    const resolved = assertImportableJobBoardUrl(url);
    expect(resolved.host, `host for ${url}`);
  }

  console.log("job-board-import smoke checks passed");
}

run();
