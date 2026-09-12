import { Resend } from "resend";
import { parseAdminEmails } from "@/lib/admin/access";

const FROM = "mingle insights <noreply@mingle.careers>";

export type InsightMetric = {
  key: string;
  label: string;
  value: number;
  prior?: number;
};

export type InsightsReport = {
  generatedAt: string;
  windowDays: number;
  metrics: InsightMetric[];
  wins: string[];
  fixes: string[];
  decisions: string[];
  source: "posthog" | "fallback";
};

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

function pctChange(current: number, prior: number): string {
  if (prior <= 0) return current > 0 ? "new" : "0%";
  const delta = ((current - prior) / prior) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)}%`;
}

async function hogqlCount(
  projectId: string,
  apiKey: string,
  host: string,
  event: string,
  days: number,
): Promise<number> {
  const url = `${host.replace(/\/$/, "")}/api/projects/${projectId}/query/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query: `SELECT count() FROM events WHERE event = '${event}' AND timestamp >= now() - INTERVAL ${days} DAY`,
      },
    }),
  });
  if (!res.ok) return 0;
  const json = (await res.json()) as { results?: Array<[number]> };
  return Number(json.results?.[0]?.[0] ?? 0);
}

async function collectPosthogMetrics(
  days: number,
): Promise<InsightMetric[] | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
  if (!apiKey || !projectId) return null;

  const half = Math.max(1, Math.floor(days / 2));
  const defs: Array<{ key: string; label: string; event: string }> = [
    { key: "signup", label: "Signups", event: "signup" },
    { key: "sign_in", label: "Sign-ins", event: "sign_in" },
    {
      key: "welcome_path_selected",
      label: "Welcome path picks",
      event: "welcome_path_selected",
    },
    {
      key: "audience_tab_selected",
      label: "Landing audience tabs",
      event: "audience_tab_selected",
    },
    {
      key: "landing_cta_clicked",
      label: "Landing CTAs",
      event: "landing_cta_clicked",
    },
    {
      key: "match_interested",
      label: "Match interested",
      event: "match_interested",
    },
    { key: "match_skipped", label: "Match skips", event: "match_skipped" },
    {
      key: "connection_sent",
      label: "Connections sent",
      event: "connection_sent",
    },
    {
      key: "mingle_created",
      label: "Mingles created",
      event: "mingle_created",
    },
    { key: "message_sent", label: "Messages sent", event: "message_sent" },
  ];

  const metrics: InsightMetric[] = [];
  for (const def of defs) {
    const [current, priorWindow] = await Promise.all([
      hogqlCount(projectId, apiKey, host, def.event, days),
      hogqlCount(projectId, apiKey, host, def.event, days + half),
    ]);
    metrics.push({
      key: def.key,
      label: def.label,
      value: current,
      prior: Math.max(0, priorWindow - current),
    });
  }
  return metrics;
}

function buildNarrative(metrics: InsightMetric[]): Pick<
  InsightsReport,
  "wins" | "fixes" | "decisions"
> {
  const byKey = Object.fromEntries(metrics.map((m) => [m.key, m]));
  const wins: string[] = [];
  const fixes: string[] = [];
  const decisions: string[] = [];

  const mingles = byKey.mingle_created;
  const interested = byKey.match_interested;
  const skips = byKey.match_skipped;
  const signups = byKey.signup;
  const ctas = byKey.landing_cta_clicked;
  const connections = byKey.connection_sent;
  const messages = byKey.message_sent;

  if (mingles && (mingles.prior ?? 0) > 0 && mingles.value > (mingles.prior ?? 0)) {
    wins.push(
      `Mingles are up ${pctChange(mingles.value, mingles.prior ?? 0)} vs the prior window — keep reinforcing mutual interest moments.`,
    );
  }
  if (signups && signups.value > 0) {
    wins.push(`${signups.value} new signups in this window.`);
  }
  if (!wins.length) {
    wins.push("Tracking is live. Baseline volume is still building.");
  }

  if (interested && skips && skips.value > interested.value * 1.5) {
    fixes.push(
      "Skips heavily outpace interested marks — tighten discovery ranking and Why-this-match clarity.",
    );
  }
  if (ctas && signups && ctas.value > 0 && signups.value / ctas.value < 0.15) {
    fixes.push(
      "Landing CTAs convert weakly to signup — test path copy and reduce friction on /start → /auth.",
    );
  }
  if (
    connections &&
    mingles &&
    connections.value > 0 &&
    mingles.value / connections.value < 0.25
  ) {
    fixes.push(
      "Connection requests rarely become mingles — improve request copy and mutual-fit explanations.",
    );
  }
  if (messages && mingles && mingles.value > 0 && messages.value / mingles.value < 1) {
    fixes.push(
      "Mingles are not chatting enough — nudge first message templates after mutual match.",
    );
  }
  if (!fixes.length) {
    fixes.push(
      "No urgent funnel regression detected — keep watching skip/interested ratio weekly.",
    );
  }

  decisions.push(
    "Should we prioritize discovery quality, onboarding completion, or post-mingle activation next sprint?",
  );
  if (ctas && ctas.value > 20) {
    decisions.push(
      "Do we keep one shared auth screen for talent + company, or split CTAs earlier on the landing?",
    );
  }
  decisions.push(
    "Keep session replay on so qualitative UX review can run without user interviews.",
  );

  return { wins, fixes, decisions };
}

export async function buildInsightsReport(
  windowDays = 14,
): Promise<InsightsReport> {
  const fromPosthog = await collectPosthogMetrics(windowDays);

  if (!fromPosthog) {
    return {
      generatedAt: new Date().toISOString(),
      windowDays,
      metrics: [
        {
          key: "setup",
          label: "Awaiting PostHog project credentials",
          value: 0,
        },
      ],
      wins: ["Product event tracking + autocapture code is live in the app."],
      fixes: [
        "Add POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID so the report can pull live product metrics.",
        "Confirm NEXT_PUBLIC_POSTHOG_KEY is set in Vercel so autocapture and session replay run in production.",
      ],
      decisions: [
        "Share PostHog project access / keys so founder emails become fully data-driven.",
      ],
      source: "fallback",
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    metrics: fromPosthog,
    ...buildNarrative(fromPosthog),
    source: "posthog",
  };
}

function renderEmailHtml(report: InsightsReport): string {
  const rows = report.metrics
    .map((m) => {
      const prior = m.prior ?? 0;
      const delta = m.prior === undefined ? "—" : pctChange(m.value, prior);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${m.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${m.value}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#64748b;">${delta}</td>
      </tr>`;
    })
    .join("");

  const list = (items: string[]) =>
    items.map((item) => `<li style="margin:0 0 8px;">${item}</li>`).join("");

  return `<!doctype html>
<html>
  <body style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f7f8fc;color:#1e1b4b;margin:0;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e8eaf2;">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;font-weight:700;">mingle insights</p>
      <h1 style="margin:0 0 8px;font-size:22px;">UX learning report</h1>
      <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
        Last ${report.windowDays} days · generated ${new Date(report.generatedAt).toUTCString()} · source ${report.source}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 12px;color:#64748b;font-weight:600;">Metric</th>
            <th style="text-align:right;padding:8px 12px;color:#64748b;font-weight:600;">Current</th>
            <th style="text-align:right;padding:8px 12px;color:#64748b;font-weight:600;">Δ vs prior</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <h2 style="font-size:16px;margin:0 0 8px;color:#15803d;">What improved</h2>
      <ul style="margin:0 0 18px;padding-left:18px;color:#334155;font-size:14px;">${list(report.wins)}</ul>
      <h2 style="font-size:16px;margin:0 0 8px;color:#b45309;">What to fix next</h2>
      <ul style="margin:0 0 18px;padding-left:18px;color:#334155;font-size:14px;">${list(report.fixes)}</ul>
      <h2 style="font-size:16px;margin:0 0 8px;color:#6d28d9;">Needs your decision</h2>
      <ul style="margin:0 0 8px;padding-left:18px;color:#334155;font-size:14px;">${list(report.decisions)}</ul>
    </div>
  </body>
</html>`;
}

export async function sendInsightsReportEmail(
  report?: InsightsReport,
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
      error: "FOUNDERS_REPORT_EMAIL or ADMIN_EMAILS missing",
    };
  }

  const payload = report ?? (await buildInsightsReport(14));
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: recipients,
    subject: `mingle UX insights · last ${payload.windowDays} days`,
    html: renderEmailHtml(payload),
  });

  if (error) {
    return { ok: false, recipients, error: error.message };
  }
  return { ok: true, recipients };
}
