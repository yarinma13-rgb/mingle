"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { MingleLogo } from "@/components/MingleLogo";
// Mascot temporarily removed from loading states — see
// components/MascotMagnet.tsx, component and assets are kept.
import { CompanyProfilePreview } from "@/components/CompanyProfilePreview";
import {
  loadCompanyProfile,
  saveCompanyProfilePatch,
  resumeCompanyStep,
  companyProfileCompletion,
  EMPTY_COMPANY_PROFILE,
  type CompanyProfileState,
} from "@/lib/company-profile/persistence";
import { saveProfileCompletion } from "@/lib/profile/persistence";
import {
  COMPANY_QUESTIONS,
  COMPANY_STAGE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
} from "@/lib/company-profile/questions";
import {
  companyBasicInfoSchema,
  shortReflectionSchema,
  type CompanyBasicInfoValues,
} from "@/lib/validation/company-profile";
import type { Database } from "@/lib/supabase/types";

const TOTAL_STEPS = 6;

type LoadState = "loading" | "ready" | "error";

type FetchResult =
  | { kind: "redirect"; to: string }
  | { kind: "ready"; userId: string; profile: CompanyProfileState }
  | { kind: "error" };

async function fetchCompanyProfileData(
  supabase: SupabaseClient<Database>,
): Promise<FetchResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "redirect", to: "/auth?path=company" };

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .single();
  if (userRow && userRow.user_type !== "company") {
    return { kind: "redirect", to: "/onboarding/talent" };
  }

  try {
    const profile = await loadCompanyProfile(supabase, user.id);
    return { kind: "ready", userId: user.id, profile };
  } catch {
    return { kind: "error" };
  }
}

export function CompanyProfileWizard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CompanyProfileState>(
    EMPTY_COMPANY_PROFILE,
  );
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const applyResult = (result: FetchResult) => {
    if (result.kind === "redirect") {
      router.replace(result.to);
      return;
    }
    if (result.kind === "error") {
      setLoadState("error");
      return;
    }
    setUserId(result.userId);
    setProfile(result.profile);
    setStep(resumeCompanyStep(result.profile));
    setLoadState("ready");
  };

  useEffect(() => {
    let active = true;
    fetchCompanyProfileData(supabase).then((result) => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const retry = () => {
    setLoadState("loading");
    fetchCompanyProfileData(supabase).then(applyResult);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyBasicInfoValues>({
    resolver: zodResolver(companyBasicInfoSchema),
    values: {
      companyName: profile.companyName,
      mission: profile.mission,
      industry: profile.industry,
      companyStage: profile.companyStage,
      companySize: profile.companySize,
      location: profile.location,
    },
  });

  const persistAndAdvance = async (
    patch: Partial<{
      company_name: string;
      logo: string | null;
      mission: string;
      industry: string;
      company_stage: string;
      company_size: string;
      location: string;
      work_environment: string[];
      values: string[];
      who_thrives_here: string;
      description: string;
      looking_for: string[];
    }>,
    nextProfile: CompanyProfileState,
    nextStep: number,
  ) => {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveCompanyProfilePatch(supabase, userId, patch);
      await saveProfileCompletion(
        supabase,
        userId,
        companyProfileCompletion(nextProfile),
      );
      setProfile(nextProfile);
      setStep(nextStep);
    } catch {
      setSaveError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const onBasicInfoSubmit = (values: CompanyBasicInfoValues) => {
    const nextProfile: CompanyProfileState = { ...profile, ...values };
    persistAndAdvance(
      {
        company_name: values.companyName,
        mission: values.mission,
        industry: values.industry,
        company_stage: values.companyStage,
        company_size: values.companySize,
        location: values.location,
      },
      nextProfile,
      2,
    );
  };

  const toggleMulti = (
    key: "workEnvironment" | "values" | "lookingFor",
    option: string,
  ) => {
    setProfile((prev) => {
      const list = prev[key];
      const next = list.includes(option)
        ? list.filter((item) => item !== option)
        : [...list, option];
      return { ...prev, [key]: next };
    });
  };

  const continueMultiStep = (
    key: "workEnvironment" | "values" | "lookingFor",
    dbColumn: "work_environment" | "values" | "looking_for",
    nextStep: number,
  ) => {
    persistAndAdvance({ [dbColumn]: profile[key] }, profile, nextStep);
  };

  const reflectionValid =
    shortReflectionSchema.safeParse(profile.whoThrivesHere).success &&
    shortReflectionSchema.safeParse(profile.description).success;

  const continueReflection = () => {
    const thrives = shortReflectionSchema.safeParse(profile.whoThrivesHere);
    const building = shortReflectionSchema.safeParse(profile.description);
    if (!thrives.success || !building.success) return;
    persistAndAdvance(
      { who_thrives_here: thrives.data, description: building.data },
      { ...profile, whoThrivesHere: thrives.data, description: building.data },
      TOTAL_STEPS,
    );
  };

  const goBack = () => {
    if (step <= 1) return;
    setStep(step - 1);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setLogoError(null);
    setUploadingLogo(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage
        .from("logos")
        .getPublicUrl(path);
      await saveCompanyProfilePatch(supabase, userId, {
        logo: publicUrl.publicUrl,
      });
      setProfile((prev) => ({ ...prev, logo: publicUrl.publicUrl }));
    } catch {
      setLogoError(
        "Logo upload isn't set up yet — you can skip this for now and add it later.",
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loadState === "loading") return <CompanyWizardSkeleton />;
  if (loadState === "error") return <CompanyWizardError onRetry={retry} />;

  if (step >= TOTAL_STEPS) {
    return <CompanyProfilePreview profile={profile} />;
  }

  const completionPct = companyProfileCompletion(profile);
  const multiQuestion =
    step === 2
      ? COMPANY_QUESTIONS[0]
      : step === 3
        ? COMPANY_QUESTIONS[1]
        : step === 4
          ? COMPANY_QUESTIONS[2]
          : null;
  const multiKey: "workEnvironment" | "values" | "lookingFor" | null =
    step === 2 ? "workEnvironment" : step === 3 ? "values" : step === 4 ? "lookingFor" : null;
  const multiColumn: "work_environment" | "values" | "looking_for" | null =
    step === 2 ? "work_environment" : step === 3 ? "values" : step === 4 ? "looking_for" : null;
  const multiNextStep = step === 2 ? 3 : step === 3 ? 4 : 5;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16 sm:px-10">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={36} className="mb-6" />
          <CompletionMeter percent={completionPct} />
          <span className="mingle-gradient-text mt-5 font-display text-xs font-semibold uppercase tracking-[0.16em]">
            Build your company profile
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-mingle-white sm:text-3xl">
            {step === 1
              ? "Who you are"
              : multiQuestion
                ? multiQuestion.headline
                : "Who thrives here"}
          </h1>
          <p className="mt-2 text-sm text-mingle-text-secondary">
            {step === 1
              ? "Your mission and what you're building."
              : multiQuestion
                ? multiQuestion.subtext
                : "The kind of person who does well on your team, and what you're building."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 1 && (
              <form
                onSubmit={handleSubmit(onBasicInfoSubmit)}
                noValidate
                className="flex flex-col gap-4"
              >
                <Field label="Company name" error={errors.companyName?.message}>
                  <input
                    {...register("companyName")}
                    className={inputClass}
                    placeholder="Nova Labs"
                  />
                </Field>

                <Field label="Mission" error={errors.mission?.message}>
                  <input
                    {...register("mission")}
                    className={inputClass}
                    placeholder="Building the tools that help teams move faster"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Industry" error={errors.industry?.message}>
                    <input
                      {...register("industry")}
                      className={inputClass}
                      placeholder="Technology"
                    />
                  </Field>
                  <Field label="Location" error={errors.location?.message}>
                    <input
                      {...register("location")}
                      className={inputClass}
                      placeholder="Tel Aviv"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Stage" error={errors.companyStage?.message}>
                    <select {...register("companyStage")} className={inputClass}>
                      <option value="">Select</option>
                      {COMPANY_STAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Size" error={errors.companySize?.message}>
                    <select {...register("companySize")} className={inputClass}>
                      <option value="">Select</option>
                      {COMPANY_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                    Company logo (optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {profile.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.logo}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    )}
                    <label className="cursor-pointer rounded-full bg-mingle-surface px-4 py-2 text-xs font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70">
                      {uploadingLogo ? "Uploading…" : "Choose logo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                  {logoError && (
                    <p className="mt-1.5 text-xs text-mingle-text-secondary">
                      {logoError}
                    </p>
                  )}
                </div>

                {saveError && (
                  <p className="text-center text-sm text-mingle-pink">
                    {saveError}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 rounded-full bg-mingle-cta px-8 py-3.5 font-display text-sm font-semibold text-mingle-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Continue"}
                </motion.button>
              </form>
            )}

            {multiQuestion && multiKey && multiColumn && (
              <div>
                <div
                  role="group"
                  aria-label={multiQuestion.headline}
                  className="flex flex-wrap justify-center gap-2.5"
                >
                  {multiQuestion.options.map((option) => {
                    const selected = profile[multiKey].includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        onClick={() => toggleMulti(multiKey, option)}
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

                {saveError && (
                  <p className="mt-6 text-center text-sm text-mingle-pink">
                    {saveError}
                  </p>
                )}

                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={saving}
                    className="rounded-full bg-mingle-surface px-6 py-3.5 font-display text-sm font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <motion.button
                    type="button"
                    onClick={() =>
                      continueMultiStep(multiKey, multiColumn, multiNextStep)
                    }
                    disabled={profile[multiKey].length === 0 || saving}
                    whileHover={
                      profile[multiKey].length > 0 ? { scale: 1.03 } : undefined
                    }
                    whileTap={
                      profile[multiKey].length > 0 ? { scale: 0.97 } : undefined
                    }
                    className={`rounded-full px-8 py-3.5 font-display text-sm font-semibold transition-colors ${
                      profile[multiKey].length > 0
                        ? "bg-mingle-cta text-mingle-white"
                        : "cursor-not-allowed bg-mingle-surface text-mingle-text-secondary/50"
                    }`}
                  >
                    {saving ? "Saving…" : "Continue"}
                  </motion.button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                    Who thrives here
                  </label>
                  <textarea
                    value={profile.whoThrivesHere}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        whoThrivesHere: e.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={1200}
                    placeholder="The kind of person who does well on your team"
                    className="w-full resize-none rounded-2xl border-2 border-mingle-surface bg-mingle-surface p-4 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none"
                  />
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                    What you&rsquo;re building
                  </label>
                  <textarea
                    value={profile.description}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={1200}
                    placeholder="What your company is building and why it matters"
                    className="w-full resize-none rounded-2xl border-2 border-mingle-surface bg-mingle-surface p-4 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none"
                  />
                </div>

                {saveError && (
                  <p className="text-center text-sm text-mingle-pink">
                    {saveError}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={saving}
                    className="rounded-full bg-mingle-surface px-6 py-3.5 font-display text-sm font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <motion.button
                    type="button"
                    onClick={continueReflection}
                    disabled={!reflectionValid || saving}
                    whileHover={reflectionValid ? { scale: 1.03 } : undefined}
                    whileTap={reflectionValid ? { scale: 0.97 } : undefined}
                    className={`rounded-full px-8 py-3.5 font-display text-sm font-semibold transition-colors ${
                      reflectionValid
                        ? "bg-mingle-cta text-mingle-white"
                        : "cursor-not-allowed bg-mingle-surface text-mingle-text-secondary/50"
                    }`}
                  >
                    {saving ? "Saving…" : "See my profile"}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-mingle-surface bg-mingle-surface px-4 py-3 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-mingle-pink">{error}</p>}
    </div>
  );
}

function CompletionMeter({ percent }: { percent: number }) {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-mingle-surface">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-mingle-pink to-mingle-purple"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-medium text-mingle-text-secondary">
        Your profile is {percent}% complete
      </span>
    </div>
  );
}

function CompanyWizardSkeleton() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6">
      <MingleLogo variant="mark" size={48} className="animate-pulse" />
    </div>
  );
}

function CompanyWizardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <MingleLogo variant="mark" size={36} />
      <p className="max-w-xs text-sm text-mingle-text-secondary">
        Something went wrong loading your profile.
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
