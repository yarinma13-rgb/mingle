"use server";

import { cookies } from "next/headers";
import { appOrigin } from "@/lib/app-origin";
import { sendRecommendationRequestEmail } from "@/lib/email/recommendation-request";
import {
  createRecommendationRequest,
  isMissingRecommendationsTable,
} from "@/lib/recommendations/persistence";
import { parseLinkedInRecSession, LINKEDIN_REC_COOKIE } from "@/lib/recommendations/linkedin-session";
import { whatsappDigits } from "@/lib/recommendations/phone";
import { createClient } from "@/lib/supabase/server";
import {
  recommendationRequestSchema,
  recommendationSubmitSchema,
} from "@/lib/validation/recommendation";

function missingTableMessage() {
  return "Recommendations are not live yet. Ask the founder to run the SQL migration.";
}

export async function requestRecommendation(input: {
  recommenderName: string;
  recommenderContact: string;
  deliveryMethod: "email" | "whatsapp";
}): Promise<
  | { ok: true; deliveryMethod: "email" }
  | { ok: true; deliveryMethod: "whatsapp"; whatsappUrl: string }
  | { ok: false; error: string }
> {
  const parsed = recommendationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to request a recommendation." };

  const { data: account } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.user_type !== "talent") {
    return { ok: false, error: "Only talent profiles can request recommendations." };
  }

  const { data: talent } = await supabase
    .from("talent_profiles")
    .select("first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const candidateName =
    `${talent?.first_name ?? ""} ${talent?.last_name ?? ""}`.trim() || "a mingle candidate";

  try {
    const row = await createRecommendationRequest(supabase, user.id, {
      recommenderName: parsed.data.recommenderName,
      recommenderContact: parsed.data.recommenderContact,
      deliveryMethod: parsed.data.deliveryMethod,
    });
    const recommendUrl = `${appOrigin()}/recommend/${row.token}`;

    if (parsed.data.deliveryMethod === "email") {
      await sendRecommendationRequestEmail({
        to: parsed.data.recommenderContact,
        candidateName,
        recommenderName: parsed.data.recommenderName,
        recommendUrl,
      });
      return { ok: true, deliveryMethod: "email" };
    }

    const phone = whatsappDigits(parsed.data.recommenderContact);
    if (!phone) return { ok: false, error: "Use a phone number with country code" };
    const text = encodeURIComponent(
      `${candidateName} asked you to write a short recommendation on mingle. ${recommendUrl}`,
    );
    return {
      ok: true,
      deliveryMethod: "whatsapp",
      whatsappUrl: `https://wa.me/${phone}?text=${text}`,
    };
  } catch (error) {
    if (isMissingRecommendationsTable(error as { message?: string; code?: string })) {
      return { ok: false, error: missingTableMessage() };
    }
    return { ok: false, error: "Couldn't save that. Try again in a moment." };
  }
}

export async function submitRecommendation(input: {
  token: string;
  rating: number;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = recommendationSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const cookieStore = await cookies();
  const session = parseLinkedInRecSession(
    cookieStore.get(LINKEDIN_REC_COOKIE.name)?.value,
  );
  if (!session || session.token !== parsed.data.token) {
    return { ok: false, error: "Sign in with LinkedIn first." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_recommendation", {
    p_token: parsed.data.token,
    p_rating: parsed.data.rating,
    p_body: parsed.data.body,
    p_linkedin_sub: session.sub,
    p_linkedin_name: session.name,
  });
  if (error) {
    if (isMissingRecommendationsTable(error)) {
      return { ok: false, error: missingTableMessage() };
    }
    const message = error.message.toLowerCase();
    if (message.includes("not open")) {
      return { ok: false, error: "This recommendation is no longer open." };
    }
    return { ok: false, error: "Couldn't save that. Try again in a moment." };
  }
  return { ok: true };
}
