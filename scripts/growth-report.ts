/**
 * Manual founder report — same builder as the biweekly cron.
 * Usage: npm run growth:report
 * Optional: GROWTH_REPORT_WRITE=1 writes docs/growth-reports/YYYY-MM-DD.md
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildGrowthReport } from "../lib/analytics/growth-report";

async function main() {
  const report = await buildGrowthReport(14);
  const date = report.generatedAt.slice(0, 10);

  if (process.env.GROWTH_REPORT_WRITE === "1") {
    const dir = join(process.cwd(), "docs/growth-reports");
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `${date}.md`);
    writeFileSync(path, report.markdown, "utf8");
    console.log(`Wrote ${path}`);
  }

  console.log(report.markdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
