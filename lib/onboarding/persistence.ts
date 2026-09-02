import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";

export type OnboardingAnswers = {
  q1: string;
  q2: string[];
  q3: string[];
};

export const EMPTY_ANSWERS: OnboardingAnswers = { q1: "", q2: [], q3: [] };

export type OnboardingState = {
  step: number;
  status: Database["public"]["Tables"]["users"]["Row"]["onboarding_status"];
  answers: OnboardingAnswers;
};

const TOTAL_STEPS = 4;

export async function loadOnboardingState(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: UserType,
): Promise<OnboardingState> {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("onboarding_step, onboarding_status")
    .eq("id", userId)
    .single();
  if (userError) throw userError;

  const answers: OnboardingAnswers =
    path === "talent"
      ? await (async () => {
          const { data, error } = await supabase
            .from("talent_preferences")
            .select("*")
            .eq("talent_id", userId)
            .maybeSingle();
          if (error) throw error;
          return {
            q1: data?.career_goals ?? "",
            q2: data?.motivations ?? [],
            q3: data?.company_types ?? [],
          };
        })()
      : await (async () => {
          const { data, error } = await supabase
            .from("company_preferences")
            .select("*")
            .eq("company_id", userId)
            .maybeSingle();
          if (error) throw error;
          return {
            q1: data?.hiring_needs ?? "",
            q2: data?.culture_priorities ?? [],
            q3: data?.talent_types ?? [],
          };
        })();

  const step = Math.min(Math.max(userRow?.onboarding_step ?? 1, 1), TOTAL_STEPS);

  return {
    step,
    status: userRow?.onboarding_status ?? "not_started",
    answers,
  };
}

export async function saveStepAnswer(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: UserType,
  questionKey: "q1" | "q2" | "q3",
  value: string | string[],
) {
  if (path === "talent") {
    const patch =
      questionKey === "q1"
        ? { career_goals: value as string }
        : questionKey === "q2"
          ? { motivations: value as string[] }
          : { company_types: value as string[] };
    const { error } = await supabase
      .from("talent_preferences")
      .upsert({ talent_id: userId, ...patch }, { onConflict: "talent_id" });
    if (error) throw error;
  } else {
    const patch =
      questionKey === "q1"
        ? { hiring_needs: value as string }
        : questionKey === "q2"
          ? { culture_priorities: value as string[] }
          : { talent_types: value as string[] };
    const { error } = await supabase
      .from("company_preferences")
      .upsert({ company_id: userId, ...patch }, { onConflict: "company_id" });
    if (error) throw error;
  }
}

export async function setOnboardingStep(
  supabase: SupabaseClient<Database>,
  userId: string,
  step: number,
) {
  const { error } = await supabase
    .from("users")
    .update({
      onboarding_step: step,
      onboarding_status: step >= TOTAL_STEPS ? "completed" : "in_progress",
      last_active_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
