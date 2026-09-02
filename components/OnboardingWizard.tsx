"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { MingleLogo } from "@/components/MingleLogo";
// Mascot temporarily removed from loading states — see
// components/MascotMagnet.tsx, component and assets are kept.
import {
  loadOnboardingState,
  saveStepAnswer,
  setOnboardingStep,
  EMPTY_ANSWERS,
  type OnboardingAnswers,
} from "@/lib/onboarding/persistence";
import {
  TALENT_QUESTIONS,
  COMPANY_QUESTIONS,
  ONBOARDING_INTRO,
  type OnboardingQuestion,
} from "@/lib/onboarding/questions";
import type { Database, UserType } from "@/lib/supabase/types";

const TOTAL_STEPS = 4;

type LoadState = "loading" | "ready" | "error";

type FetchResult =
  | { kind: "redirect"; to: string }
  | { kind: "ready"; userId: string; step: number; answers: OnboardingAnswers }
  | { kind: "error" };

// Pure data fetch — no setState here. Keeping state updates out of this
// function (and only applying them in the effect/handler that calls it)
// is what satisfies react-hooks/set-state-in-effect for an async load.
async function fetchWizardData(
  supabase: SupabaseClient<Database>,
  path: UserType,
): Promise<FetchResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kind: "redirect", to: `/auth?path=${path}` };

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (userRow && userRow.user_type !== path) {
    return { kind: "redirect", to: `/onboarding/${userRow.user_type}` };
  }

  try {
    const state = await loadOnboardingState(supabase, user.id, path);
    return {
      kind: "ready",
      userId: user.id,
      step: state.step,
      answers: state.answers,
    };
  } catch {
    return { kind: "error" };
  }
}

export function OnboardingWizard({ path }: { path: UserType }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ANSWERS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const questions = path === "talent" ? TALENT_QUESTIONS : COMPANY_QUESTIONS;
  const intro = ONBOARDING_INTRO[path];

  const applyFetchResult = (result: FetchResult) => {
    if (result.kind === "redirect") {
      router.replace(result.to);
      return;
    }
    if (result.kind === "error") {
      setLoadState("error");
      return;
    }
    setUserId(result.userId);
    setStep(result.step);
    setAnswers(result.answers);
    setLoadState("ready");
  };

  useEffect(() => {
    let active = true;
    fetchWizardData(supabase, path).then((result) => {
      if (active) applyFetchResult(result);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, supabase]);

  const retry = () => {
    setLoadState("loading");
    fetchWizardData(supabase, path).then(applyFetchResult);
  };

  const currentQuestion: OnboardingQuestion | undefined = questions[step - 1];

  const isAnswered = (key: "q1" | "q2" | "q3") => {
    const value = answers[key];
    return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
  };

  const selectSingle = (key: "q1", option: string) => {
    setAnswers((prev) => ({ ...prev, [key]: option }));
  };

  const toggleMulti = (key: "q2" | "q3", option: string) => {
    setAnswers((prev) => {
      const list = prev[key];
      const next = list.includes(option)
        ? list.filter((item) => item !== option)
        : [...list, option];
      return { ...prev, [key]: next };
    });
  };

  const handleContinue = async () => {
    if (!userId || !currentQuestion) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveStepAnswer(
        supabase,
        userId,
        path,
        currentQuestion.key,
        answers[currentQuestion.key],
      );
      const nextStep = step + 1;
      await setOnboardingStep(supabase, userId, nextStep);
      setStep(nextStep);
    } catch {
      setSaveError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (!userId || step <= 1) return;
    const prevStep = step - 1;
    setStep(prevStep);
    setOnboardingStep(supabase, userId, prevStep).catch(() => {});
  };

  if (loadState === "loading") return <WizardSkeleton />;
  if (loadState === "error") return <WizardError onRetry={retry} />;

  if (step > 3 || !currentQuestion) {
    return <OnboardingComplete path={path} />;
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16 sm:px-10">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={36} className="mb-6" />
          <ProgressBar step={step} total={TOTAL_STEPS} />
          <span className="mingle-gradient-text mt-5 font-display text-xs font-semibold uppercase tracking-[0.16em]">
            {intro.eyebrow}
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-mingle-white sm:text-3xl">
            {intro.headline}
          </h1>
          <p className="mt-2 text-sm text-mingle-text-secondary">
            {intro.subtext}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.key}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h2 className="text-center font-display text-lg font-semibold text-mingle-white">
              {currentQuestion.question}
            </h2>

            <div
              role={currentQuestion.type === "single" ? "radiogroup" : "group"}
              aria-label={currentQuestion.question}
              className="mt-6 flex flex-wrap justify-center gap-2.5"
            >
              {currentQuestion.options.map((option) => {
                const selected =
                  currentQuestion.type === "single"
                    ? answers.q1 === option
                    : (answers[currentQuestion.key as "q2" | "q3"]).includes(
                        option,
                      );
                return (
                  <button
                    key={option}
                    type="button"
                    role={currentQuestion.type === "single" ? "radio" : "checkbox"}
                    aria-checked={selected}
                    onClick={() =>
                      currentQuestion.type === "single"
                        ? selectSingle("q1", option)
                        : toggleMulti(currentQuestion.key as "q2" | "q3", option)
                    }
                    className={`rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-mingle-purple bg-mingle-purple/15 text-mingle-white"
                        : "border-mingle-surface bg-mingle-surface text-mingle-text-secondary hover:border-mingle-purple/50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {saveError && (
          <p className="mt-6 text-center text-sm text-mingle-pink">
            {saveError}
          </p>
        )}

        <div className="mt-10 flex items-center justify-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="rounded-full bg-mingle-surface px-6 py-3.5 font-display text-sm font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70 disabled:opacity-50"
            >
              Back
            </button>
          )}
          <motion.button
            type="button"
            onClick={handleContinue}
            disabled={!isAnswered(currentQuestion.key) || saving}
            whileHover={
              isAnswered(currentQuestion.key) ? { scale: 1.03 } : undefined
            }
            whileTap={
              isAnswered(currentQuestion.key) ? { scale: 0.97 } : undefined
            }
            className={`rounded-full px-8 py-3.5 font-display text-sm font-semibold transition-colors ${
              isAnswered(currentQuestion.key)
                ? "bg-mingle-cta text-mingle-white"
                : "cursor-not-allowed bg-mingle-surface text-mingle-text-secondary/50"
            }`}
          >
            {saving ? "Saving…" : "Continue"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((dot) => (
          <span
            key={dot}
            className={`h-1.5 w-7 rounded-full transition-colors ${
              dot <= step
                ? "bg-gradient-to-r from-mingle-pink to-mingle-purple"
                : "bg-mingle-surface"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-mingle-text-secondary">
        {String(Math.min(step, total)).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6">
      <MingleLogo variant="mark" size={48} className="animate-pulse" />
    </div>
  );
}

function WizardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <MingleLogo variant="mark" size={36} />
      <p className="max-w-xs text-sm text-mingle-text-secondary">
        Something went wrong loading your onboarding progress.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-mingle-surface px-6 py-3 font-display text-sm font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70"
      >
        Try again
      </button>
    </div>
  );
}

function OnboardingComplete({ path }: { path: UserType }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span
            aria-hidden
            className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple opacity-30 blur-2xl"
          />
          <MingleLogo variant="mark" size={56} className="relative" />
        </div>

        <h1 className="mt-8 font-display text-3xl font-bold text-mingle-white">
          You&rsquo;re all set
        </h1>
        <p className="mt-3 max-w-sm text-base text-mingle-text-secondary">
          Now let&rsquo;s build the part of your profile that a CV can&rsquo;t show.
        </p>

        <Link
          href={path === "talent" ? "/profile/build" : "/company-profile/build"}
          className="mt-10 rounded-full bg-mingle-cta px-8 py-3.5 font-display text-sm font-semibold text-mingle-white"
        >
          Build my profile
        </Link>
      </motion.div>
    </div>
  );
}
