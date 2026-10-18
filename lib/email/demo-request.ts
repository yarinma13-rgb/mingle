import { Resend } from "resend";
import { parseAdminEmails } from "@/lib/admin/access";

const FROM = "mingle demo requests <noreply@mingle.careers>";

export type DemoRequestPayload = {
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  companyName: string;
  companySize: string;
  explore: string;
  message: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function recipients(): string[] {
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

export async function sendDemoRequestEmail(
  input: DemoRequestPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = recipients();
  if (!to.length) {
    return { ok: false, error: "FOUNDERS_REPORT_EMAIL or ADMIN_EMAILS is not configured." };
  }
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not configured." };

  const name = `${input.firstName} ${input.lastName}`.trim();
  const source =
    [input.utmSource, input.utmMedium, input.utmCampaign].filter(Boolean).join(" / ") ||
    input.referrer ||
    "direct";

  const lines: Array<[string, string]> = [
    ["Name", name],
    ["Email", input.workEmail],
    ["Title", input.jobTitle || "(none)"],
    ["Company", `${input.companyName} (${input.companySize})`],
    ["Wants to explore", input.explore],
    ["Source", source],
  ];

  const text = [
    "New demo request",
    "",
    ...lines.map(([k, v]) => `${k}: ${v}`),
    "",
    input.message || "(no message)",
  ].join("\n");

  const html = [
    "<p><strong>New demo request</strong></p>",
    `<p>${lines
      .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}`)
      .join("<br/>")}</p>`,
    `<p style="white-space:pre-wrap">${escapeHtml(input.message || "(no message)")}</p>`,
  ].join("");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: input.workEmail,
      subject: `[mingle demo] ${input.companyName} — ${name}`,
      text,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}
