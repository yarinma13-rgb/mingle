import { Resend } from "resend";

const FROM = "mingle <noreply@mingle.careers>";

export type WeeklyDigestData = {
  to: string;
  newPotentialMatches: number;
  profileInsight: string | null;
  discoverUrl: string;
};

function renderHtml(data: WeeklyDigestData): string {
  const matchLine =
    data.newPotentialMatches > 0
      ? `<p style="margin:0 0 12px;">${data.newPotentialMatches} new potential ${
          data.newPotentialMatches === 1 ? "match" : "matches"
        } joined mingle this week.</p>`
      : `<p style="margin:0 0 12px;color:#77738a;">No new potential matches this week — worth checking Discover again in a few days.</p>`;
  const insightLine = data.profileInsight
    ? `<p style="margin:0 0 12px;">${data.profileInsight}</p>`
    : "";

  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#1C1B2E;padding:24px;max-width:480px;margin:0 auto;">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7B2FF7;font-weight:700;">Your mingle this week</p>
<h1 style="margin:0 0 16px;font-size:20px;">Here's what's new</h1>
${matchLine}
${insightLine}
<a href="${data.discoverUrl}" style="display:inline-block;margin-top:8px;padding:10px 20px;border-radius:999px;background:linear-gradient(90deg,#EA1E63,#7B2FF7,#3E6BE0);color:#fff;text-decoration:none;font-weight:600;font-size:14px;">Open Discover</a>
<p style="color:#77738a;font-size:12px;margin-top:28px;">mingle</p>
</body></html>`;
}

export async function sendWeeklyDigestEmail(
  data: WeeklyDigestData,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: "Your mingle this week",
    html: renderHtml(data),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
