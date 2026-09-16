import { Resend } from "resend";

const FROM = "mingle <noreply@mingle.careers>";

export async function sendGrowthNudgeEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" };

  const resend = new Resend(apiKey);
  const html = `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#252238;padding:24px;">
<p style="white-space:pre-wrap;">${input.body.replace(/</g, "&lt;")}</p>
<p style="color:#77738a;font-size:12px;margin-top:24px;">mingle · Early Access</p>
</body></html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
