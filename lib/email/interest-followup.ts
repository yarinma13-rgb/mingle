import { Resend } from "resend";
import type { InterestPayload } from "@/lib/outbound-interest/token";

const FROM = "mingle <noreply@mingle.careers>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Founder-approved Hebrew outreach body (updated 2026-09-20).
 * `link` re-embeds the same per-lead /r/[token] interest link inline, at the
 * position the founder placed it — one message everywhere, no fixed URL.
 */
export function buildInterestFollowUpBody(
  payload: InterestPayload,
  link?: string,
): string {
  void payload; // role/name are no longer referenced in this copy
  const linkLine = link ? `${link}\n` : "";
  return (
    "היי, נעים מאוד!\n" +
    "שמנו לב שיש לכם מגוון משרות פתוחות, ורצינו להציע לכם לפרסם אותן ב-mingle.\n" +
    "mingle עוזרת לחברות לחסוך זמן ועלויות בתהליכי גיוס, באמצעות התאמה שמתבססת גם על ניסיון מקצועי וגם על " +
    "interpersonal skills, סביבת עבודה, כיוון קריירה ועוד.\n" +
    "נשמח להראות לך בדמו קצר איך זה עובד, ואיך המשרות שלכם יכולות להגיע לטאלנטים שמתאימים להן באמת:\n" +
    linkLine +
    "נשמח להתחבר ולבחון יחד את האפשרות לצרף אתכם להשקה הראשונית של mingle במסגרת קיט ההטבות שלנו."
  );
}

export async function sendInterestFollowUpEmail(input: {
  to: string;
  payload: InterestPayload;
  link?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const enabled = (process.env.OUTBOUND_FOLLOWUP_ON_CLICK || "true").toLowerCase();
  if (enabled === "false" || enabled === "0" || enabled === "no") {
    return { ok: true, skipped: true };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: true, skipped: true };

  const to = input.to.trim();
  if (!to || !to.includes("@")) return { ok: false, error: "missing email" };

    const body = buildInterestFollowUpBody(input.payload, input.link);
  const subject = "רעיון קצר בקשר לגיוס אצלכם";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://app.mingle.careers";
  const imageUrl = `${appUrl.replace(/\/$/, "")}/brand/email-visual.png`;

  const html = `<!doctype html><html lang="he" dir="rtl"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#252238;padding:24px;direction:rtl;text-align:right;">
<p style="white-space:pre-wrap;margin:0;">${escapeHtml(body)}</p>
<img src="${imageUrl}" width="280" height="128" alt="mingle — Why this match: skills, culture, and career direction" style="display:block;margin:20px 0;border-radius:10px;max-width:100%;height:auto;" />
<p style="color:#77738a;font-size:12px;margin-top:8px;">mingle.careers</p>
</body></html>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      text: body,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return { ok: false, error: message };
  }
}
