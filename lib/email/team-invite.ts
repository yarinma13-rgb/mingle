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

export async function sendTeamInviteEmail(input: {
  to: string;
  inviteeName: string;
  companyName: string;
  roleLabel: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const joinUrl = `${appOrigin()}/auth?path=company`;
  const greeting = input.inviteeName.trim() || "there";
  const text = [
    `Hi ${greeting},`,
    "",
    `${input.companyName} invited you to join their hiring team on mingle as ${input.roleLabel}.`,
    "Continue with this email to join the existing workspace instead of creating a new company profile.",
    "",
    joinUrl,
  ].join("\n");

  const html = [
    `<p>Hi ${escapeHtml(greeting)},</p>`,
    `<p>${escapeHtml(input.companyName)} invited you to join their hiring team on mingle as ${escapeHtml(input.roleLabel)}.</p>`,
    "<p>Continue with this email to join the existing workspace instead of creating a new company profile.</p>",
    `<p><a href="${escapeHtml(joinUrl)}">Join the team</a></p>`,
  ].join("");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `Join the team at ${input.companyName} on mingle`,
      text,
      html,
    });
    if (error) {
      console.error("Resend team invite email failed:", error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Resend team invite email failed:", message);
  }
}
