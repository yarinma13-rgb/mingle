import { Resend } from "resend";
import { parseAdminEmails } from "@/lib/admin/access";
import { appOrigin } from "@/lib/app-origin";
import { captureException } from "@/lib/monitoring/sentry";

const FROM = "mingle jobs engine <noreply@mingle.careers>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Operational alert for the External Opportunities engine: Sentry (if
 * configured) plus an email to ADMIN_EMAILS (if Resend is configured).
 * Never throws.
 */
export async function sendEngineAlert(subject: string, lines: string[]): Promise<void> {
  captureException(new Error(`[external-jobs] ${subject}: ${lines.join(" | ").slice(0, 500)}`));

  const to = parseAdminEmails();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!to.length || !apiKey) return;
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to,
      subject: `[mingle jobs] ${subject}`,
      html: `<p>${lines.map(escapeHtml).join("<br/>")}</p><p><a href="${appOrigin()}/admin/external-jobs">Open the External Jobs dashboard</a></p>`,
      text: `${lines.join("\n")}\n\n${appOrigin()}/admin/external-jobs`,
    });
  } catch (error) {
    captureException(error);
  }
}
