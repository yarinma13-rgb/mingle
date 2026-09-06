import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const FROM = "mingle <noreply@mingle.careers>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mingle.careers";
  return raw.replace(/\/$/, "");
}

async function senderLabel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const [{ data: talent }, { data: company }] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("company_profiles")
      .select("company_name")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const person = `${talent?.first_name ?? ""} ${talent?.last_name ?? ""}`.trim();
  return person || company?.company_name?.trim() || "Someone on mingle";
}

export async function sendConnectionRequestEmail(toUserId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === toUserId) return;

  const { data: connection } = await supabase
    .from("connections")
    .select("id")
    .eq("requester_id", user.id)
    .eq("recipient_id", toUserId)
    .eq("status", "pending")
    .maybeSingle();
  if (!connection) return;

  const { data: recipient } = await supabase
    .from("users")
    .select("email")
    .eq("id", toUserId)
    .maybeSingle();
  const to = recipient?.email?.trim();
  if (!to) return;

  const who = await senderLabel(supabase, user.id);
  const connectionsUrl = `${appOrigin()}/connections`;
  const text = [
    `${who} sent you a connection request on mingle.`,
    "",
    "Open your connections to see who, and respond when you are ready.",
    "",
    connectionsUrl,
  ].join("\n");

  const safeWho = escapeHtml(who);
  const html = [
    `<p>${safeWho} sent you a connection request on mingle.</p>`,
    "<p>Open your connections to see who, and respond when you are ready.</p>",
    `<p><a href="${escapeHtml(connectionsUrl)}">Open connections</a></p>`,
  ].join("");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "You have a new connection request on mingle",
      text,
      html,
    });
    if (error) {
      console.error("Resend connection request email failed:", error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Resend connection request email failed:", message);
  }
}
