import { Resend } from "resend";
import { parseAdminEmails } from "@/lib/admin/access";

const FROM = "mingle support <noreply@mingle.careers>";

export type SupportRequestPayload = {
  userId: string;
  userEmail: string;
  userType: string;
  category: string;
  subject: string;
  message: string;
  pageUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function supportRecipients(): string[] {
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

export async function sendSupportRequestEmail(
  input: SupportRequestPayload,
): Promise<{ ok: true; recipients: string[] } | { ok: false; error: string }> {
  const recipients = supportRecipients();
  if (!recipients.length) {
    return {
      ok: false,
      error: "FOUNDERS_REPORT_EMAIL or ADMIN_EMAILS is not configured.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const subjectLine = `[mingle support] ${input.category}: ${input.subject || "Problem report"}`;
  const text = [
    "New in-app support report",
    "",
    `From: ${input.userEmail}`,
    `User id: ${input.userId}`,
    `Path: ${input.userType}`,
    `Category: ${input.category}`,
    `Subject: ${input.subject || "(none)"}`,
    input.pageUrl ? `Page: ${input.pageUrl}` : null,
    "",
    input.message,
  ]
    .filter(Boolean)
    .join("\n");

  const html = [
    "<p><strong>New in-app support report</strong></p>",
    `<p><strong>From:</strong> ${escapeHtml(input.userEmail)}<br/>`,
    `<strong>User id:</strong> ${escapeHtml(input.userId)}<br/>`,
    `<strong>Path:</strong> ${escapeHtml(input.userType)}<br/>`,
    `<strong>Category:</strong> ${escapeHtml(input.category)}<br/>`,
    `<strong>Subject:</strong> ${escapeHtml(input.subject || "(none)")}</p>`,
    input.pageUrl
      ? `<p><strong>Page:</strong> ${escapeHtml(input.pageUrl)}</p>`
      : "",
    `<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
  ].join("");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      replyTo: input.userEmail,
      subject: subjectLine,
      text,
      html,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, recipients };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}
