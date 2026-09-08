import { Resend } from "resend";
import { appOrigin } from "@/lib/app-origin";

const FROM = "mingle <noreply@mingle.careers>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { appOrigin };

export async function sendRecommendationRequestEmail(input: {
  to: string;
  candidateName: string;
  recommenderName: string;
  recommendUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const text = [
    `Hi ${input.recommenderName},`,
    "",
    `${input.candidateName} asked you to write a short recommendation on mingle.`,
    "Sign in with LinkedIn on this page, then add a star rating and a few words.",
    "",
    input.recommendUrl,
  ].join("\n");

  const html = [
    `<p>Hi ${escapeHtml(input.recommenderName)},</p>`,
    `<p>${escapeHtml(input.candidateName)} asked you to write a short recommendation on mingle.</p>`,
    "<p>Sign in with LinkedIn on this page, then add a star rating and a few words.</p>",
    `<p><a href="${escapeHtml(input.recommendUrl)}">Write the recommendation</a></p>`,
  ].join("");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `${input.candidateName} asked for a recommendation on mingle`,
      text,
      html,
    });
    if (error) {
      console.error("Resend recommendation request email failed:", error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Resend recommendation request email failed:", message);
  }
}
