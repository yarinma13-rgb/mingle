import { Resend } from "resend";
import type { InterestPayload } from "@/lib/outbound-interest/token";

const FROM = "mingle <noreply@mingle.careers>";

const HEBREW_FIRST: Record<string, string> = {
  maya: "מאיה",
  tom: "תום",
  dana: "דנה",
  ori: "אורי",
  lior: "ליאור",
  yael: "יעל",
  noa: "נועה",
  gal: "גל",
  tal: "טל",
  amit: "עמית",
  amir: "אמיר",
  omer: "עומר",
  david: "דוד",
  daniel: "דניאל",
  alex: "אלכס",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hebrewFirstName(fullName?: string): string {
  const raw = (fullName || "").trim().split(/\s+/)[0] || "";
  if (!raw) return "";
  if (/[\u0590-\u05FF]/.test(raw)) return raw;
  return HEBREW_FIRST[raw.toLowerCase()] || raw;
}

/** Exact founder-approved Hebrew outreach body (no click-acknowledgment). */
export function buildInterestFollowUpBody(payload: InterestPayload): string {
  const name = hebrewFirstName(payload.n);
  const role = (payload.r || "").trim() || "התפקיד הפתוח";
  const greeting = name ? `היי ${name},` : "היי,";
  return (
    `${greeting} ראיתי שאתם מגייסים ${role}. ` +
    "יש לנו ב־mingle דרך קצת אחרת לזהות התאמה לתפקיד, מעבר ל־CV ולניסיון המקצועי. " +
    "חשבתי שהמשרה הזו יכולה להיות אחלה דוגמה לראות את זה בפועל. " +
    "רוצה לראות?"
  );
}

export async function sendInterestFollowUpEmail(input: {
  to: string;
  payload: InterestPayload;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const enabled = (process.env.OUTBOUND_FOLLOWUP_ON_CLICK || "true").toLowerCase();
  if (enabled === "false" || enabled === "0" || enabled === "no") {
    return { ok: true, skipped: true };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: true, skipped: true };

  const to = input.to.trim();
  if (!to || !to.includes("@")) return { ok: false, error: "missing email" };

  const body = buildInterestFollowUpBody(input.payload);
  const role = (input.payload.r || "").trim() || "הגיוס";
  const subject = `רעיון קצר לגבי ${role}`;

  const html = `<!doctype html><html lang="he" dir="rtl"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#252238;padding:24px;direction:rtl;text-align:right;">
<p style="white-space:pre-wrap;margin:0;">${escapeHtml(body)}</p>
<p style="color:#77738a;font-size:12px;margin-top:28px;">mingle.careers</p>
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
