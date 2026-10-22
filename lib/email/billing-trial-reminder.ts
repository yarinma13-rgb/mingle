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

export type TrialReminderResult = { ok: boolean; error?: string };

/**
 * Sent 7 days before the first charge. Prices exclude VAT/sales tax, which is
 * added on the invoice — the email says so rather than quoting a gross figure.
 */
export async function sendTrialReminderEmail(input: {
  to: string;
  planLabel: string;
  priceLabel: string;
  chargeDateLabel: string;
}): Promise<TrialReminderResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false };

  const billingUrl = `${appOrigin()}/billing`;
  const text = [
    "Hi,",
    "",
    `Your free trial of the ${input.planLabel} plan on mingle ends in 7 days.`,
    `On ${input.chargeDateLabel} the card you saved will be charged ${input.priceLabel} per month, plus VAT or sales tax where it applies.`,
    "",
    "Nothing to do if you want to keep going. To change plan, update your card, or cancel before the first charge, open your billing page:",
    billingUrl,
    "",
    "If you cancel before that date you will not be charged.",
  ].join("\n");

  const html = [
    "<p>Hi,</p>",
    `<p>Your free trial of the <strong>${escapeHtml(input.planLabel)}</strong> plan on mingle ends in 7 days.</p>`,
    `<p>On <strong>${escapeHtml(input.chargeDateLabel)}</strong> the card you saved will be charged <strong>${escapeHtml(input.priceLabel)}</strong> per month, plus VAT or sales tax where it applies.</p>`,
    "<p>Nothing to do if you want to keep going. To change plan, update your card, or cancel before the first charge, open your billing page.</p>",
    `<p><a href="${escapeHtml(billingUrl)}">Manage billing</a></p>`,
    "<p>If you cancel before that date you will not be charged.</p>",
  ].join("");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: "Your mingle free trial ends in 7 days",
      text,
      html,
    });
    if (error) {
      console.error("Resend trial reminder email failed:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Resend trial reminder email failed:", message);
    return { ok: false, error: message };
  }
}
