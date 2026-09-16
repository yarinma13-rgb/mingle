import {
  GROWTH_REPORT_WINDOW_DAYS,
  NORTH_STAR_EVENT,
} from "@/lib/analytics/metrics";
import {
  loadFunnelSnapshot,
  type FunnelSnapshot,
} from "@/lib/analytics/funnel-snapshot";
import { buildInsightsReport, type InsightsReport } from "@/lib/analytics/insights-report";
import type { GrowthNudgeRunResult } from "@/lib/growth/run-nudges";
import { parseAdminEmails } from "@/lib/admin/access";

export type GrowthReport = {
  generatedAt: string;
  windowDays: number;
  markdown: string;
  snapshot: FunnelSnapshot;
  posthog: InsightsReport | null;
  nudges: GrowthNudgeRunResult;
};

function pctDelta(current: number, prior: number): string {
  if (prior <= 0) return current > 0 ? "new" : "0%";
  const delta = ((current - prior) / prior) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)}%`;
}

function ahaRate(snapshot: FunnelSnapshot): string {
  const { ahaEligibleSignups, ahaReached } = snapshot.current;
  if (ahaEligibleSignups <= 0) return "n/a (no signups in window)";
  return `${((ahaReached / ahaEligibleSignups) * 100).toFixed(0)}% (${ahaReached}/${ahaEligibleSignups})`;
}

function marketplaceWarning(snapshot: FunnelSnapshot): string {
  const t = snapshot.current.activeTalents;
  const c = snapshot.current.activeCompanies;
  if (t === 0 && c === 0) return "No active profiles yet — seed Discover liquidity.";
  if (c === 0) return "No company profiles — talent side cannot match.";
  if (t === 0) return "No talent profiles — company side cannot match.";
  const ratio = t / c;
  if (ratio > 8) return `Talent-heavy marketplace (${t}:${c}). Seed more companies.`;
  if (ratio < 0.5) return `Company-heavy marketplace (${t}:${c}). Seed more talent.`;
  return `Balanced enough for Early Access (${t} talents · ${c} companies).`;
}

export function renderGrowthReportMarkdown(input: {
  snapshot: FunnelSnapshot;
  posthog: InsightsReport | null;
  nudges: GrowthNudgeRunResult;
  windowDays: number;
}): string {
  const { snapshot, posthog, nudges, windowDays } = input;
  const start = snapshot.start.slice(0, 10);
  const end = snapshot.end.slice(0, 10);
  const c = snapshot.current;
  const p = snapshot.prior;
  const ns = c.minglesCreated;
  const nsPrior = p.minglesCreated;

  const funnelRows = [
    ["Signups", c.signups, p.signups],
    ["Onboarding complete", c.onboardingComplete, "—"],
    ["Connections sent", c.connectionsSent, p.connectionsSent],
    [`North Star (${NORTH_STAR_EVENT})`, ns, nsPrior],
    ["Messages sent", c.messagesSent, p.messagesSent],
  ]
    .map(
      ([stage, count, prior]) =>
        `| ${stage} | ${count} | ${prior === "—" ? "—" : pctDelta(Number(count), Number(prior))} |`,
    )
    .join("\n");

  const posthogWins = posthog?.wins ?? [];
  const posthogFixes = posthog?.fixes ?? [];
  const posthogDecisions = posthog?.decisions ?? [];

  const autoActions =
    nudges.actions.length > 0
      ? nudges.actions.map((a) => `- ${a}`).join("\n")
      : "- None fired (or nudges disabled / no eligible users).";

  const dataNote =
    snapshot.source === "unavailable"
      ? `\n> ${snapshot.note ?? "Supabase snapshot unavailable."}\n`
      : "";

  return `# mingle growth report — ${start} → ${end}
${dataNote}
## 1. North Star
- Meaningful matches (\`${NORTH_STAR_EVENT}\`): **${ns}** (Δ vs prior period: **${pctDelta(ns, nsPrior)}**)
- ${ns > nsPrior ? "Trending up — keep reinforcing mutual interest and first message nudges." : ns < nsPrior ? "Down vs prior — check Discover quality and connection acceptance." : "Flat — Early Access volume still building."}

## 2. Funnel snapshot
| Stage | Count | Δ vs prior |
| --- | ---: | ---: |
${funnelRows}

Talent signups: ${c.signupsTalent} · Company signups: ${c.signupsCompany}

## 3. Marketplace balance
- Active talents: ${c.activeTalents}
- Active companies: ${c.activeCompanies}
- ${marketplaceWarning(snapshot)}

## 4. What improved (system or product)
${posthogWins.length ? posthogWins.map((w) => `- ${w}`).join("\n") : "- Baseline tracking live; waiting on more production volume."}

## 5. What to improve next (prioritized)
${
    posthogFixes.length
      ? posthogFixes
          .slice(0, 5)
          .map((f, i) => `${i + 1}. ${f} _(owner: eng)_`)
          .join("\n")
      : "1. Wire PostHog project keys for live funnel deltas _(owner: eng)_"
  }

## 6. Auto-actions taken this period
${autoActions}

## 7. Outside system ability (founder only)
${posthogDecisions.map((d) => `- ${d}`).join("\n")}
- Cold outreach, ICP, pricing, brand positioning, ad creative, legal, partnerships
- Seeding Discover liquidity (supply of quality talent + companies)

## 8. Experiments to run next ${windowDays} days
1. Measure Aha v1 rate weekly (target: profile + connection within 48h) — current window: **${ahaRate(snapshot)}**
2. One onboarding copy test for talent path completion _(owner: founder + eng)_
3. Post-mingle first-message nudge A/B _(owner: eng)_
`;
}

export async function buildGrowthReport(
  windowDays = GROWTH_REPORT_WINDOW_DAYS,
): Promise<GrowthReport> {
  const { runGrowthNudges } = await import("@/lib/growth/run-nudges");
  const [snapshot, posthog, nudges] = await Promise.all([
    loadFunnelSnapshot(windowDays),
    buildInsightsReport(windowDays),
    runGrowthNudges(),
  ]);

  const markdown = renderGrowthReportMarkdown({
    snapshot,
    posthog: posthog.source === "posthog" ? posthog : null,
    nudges,
    windowDays,
  });

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    markdown,
    snapshot,
    posthog,
    nudges,
  };
}

function reportRecipients(): string[] {
  const raw =
    process.env.FOUNDERS_REPORT_EMAIL?.trim() ||
    process.env.INSIGHTS_EMAIL?.trim() ||
    "";
  const explicit = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (explicit.length) return explicit;
  return parseAdminEmails();
}

export async function sendGrowthReportEmail(
  report?: GrowthReport,
): Promise<{ ok: boolean; recipients: string[]; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipients = reportRecipients();
  if (!apiKey) {
    return { ok: false, recipients, error: "RESEND_API_KEY missing" };
  }
  if (!recipients.length) {
    return {
      ok: false,
      recipients,
      error: "FOUNDERS_REPORT_EMAIL missing",
    };
  }

  const payload = report ?? (await buildGrowthReport());
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const start = payload.snapshot.start.slice(0, 10);
  const end = payload.snapshot.end.slice(0, 10);
  const { error } = await resend.emails.send({
    from: "mingle growth <noreply@mingle.careers>",
    to: recipients,
    subject: `mingle growth report · ${start} → ${end}`,
    html: growthReportToEmailHtml(payload),
  });
  if (error) return { ok: false, recipients, error: error.message };
  return { ok: true, recipients };
}

export function growthReportToEmailHtml(report: GrowthReport): string {
  const escaped = report.markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!doctype html>
<html><body style="font-family:Inter,Arial,sans-serif;background:#f7f8fc;padding:24px;color:#252238;">
<div style="max-width:720px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #d9e4f2;">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0073ea;font-weight:700;">mingle growth</p>
<h1 style="margin:0 0 16px;font-size:20px;">Biweekly learning report</h1>
<pre style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.55;margin:0;">${escaped}</pre>
</div></body></html>`;
}
