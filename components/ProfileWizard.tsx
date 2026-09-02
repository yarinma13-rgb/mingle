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
import { ProfilePreview } from "@/components/ProfilePreview";
import { TalentCvField } from "@/components/profile/TalentCvField";
import {
  loadProfile,
  saveProfilePatch,
  saveProfileCompletion,
  resumeStep,
  profileCompletion,
  EMPTY_PROFILE,
  type ProfileState,
} from "@/lib/profile/persistence";
import { PROFILE_QUESTIONS, BEYOND_CV_SUB_PROMPTS } from "@/lib/profile/questions";
import {
  basicProfileSchema,
  beyondCvSchema,
  type BasicProfileValues,
} from "@/lib/validation/profile";
import type { Database } from "@/lib/supabase/types";

const TOTAL_STEPS = 6;

type LoadState = "loading" | "ready" | "error";

type FetchResult =
  | { kind: "redirect"; to: string }
  | { kind: "ready"; userId: string; profile: ProfileState }
  | { kind: "error" };

async function fetchProfileData(
  supabase: SupabaseClient<Database>,
): Promise<FetchResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "redirect", to: "/auth?path=talent" };

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .single();
  if (userRow && userRow.user_type !== "talent") {
    return { kind: "redirect", to: "/onboarding/company" };
  }

  try {
    const profile = await loadProfile(supabase, user.id);
    return { kind: "ready", userId: user.id, profile };
  } catch {
    return { kind: "error" };
  }
}

export function ProfileWizard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    setStep(resumeStep(result.profile));
    setLoadState("ready");
  };

  useEffect(() => {
    let active = true;
    fetchProfileData(supabase).then((result) => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const retry = () => {
    setLoadState("loading");
    fetchProfileData(supabase).then(applyResult);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicProfileValues>({
    resolver: zodResolver(basicProfileSchema),
    values: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      location: profile.location,
      yearsExperience: profile.yearsExperience ?? undefined,
      currentRole: profile.currentRole,
      industry: profile.industry,
    } as BasicProfileValues,
  });

  const persistAndAdvance = async (
    patch: Partial<{
      first_name: string;
      last_name: string;
      headline: string;
      location: string;
      years_experience: number;
      current_job_title: string;
      industry: string;
      profile_photo: string | null;
      drives: string[];
      work_style: string[];
      looking_for: string[];
      beyond_cv: string;
    }>,
    nextProfile: ProfileState,
    nextStep: number,
  ) => {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveProfilePatch(supabase, userId, patch);
      await saveProfileCompletion(
        supabase,
        userId,
        profileCompletion(nextProfile),
      );
      setProfile(nextProfile);
      setStep(nextStep);
    } catch {
      setSaveError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const onBasicInfoSubmit = (values: BasicProfileValues) => {
    const nextProfile: ProfileState = { ...profile, ...values };
    persistAndAdvance(
      {
        first_name: values.firstName,
        last_name: values.lastName,
        headline: values.headline,
        location: values.location,
        years_experience: values.yearsExperience,
        current_job_title: values.currentRole,
        industry: values.industry,
      },
      nextProfile,
      2,
    );
  };

  const toggleMulti = (key: "drives" | "workStyle" | "lookingFor", option: string) => {
    setProfile((prev) => {
      const list = prev[key];
      const next = list.includes(option)
        ? list.filter((item) => item !== option)
        : [...list, option];
      return { ...prev, [key]: next };
    });
  };

  const continueMultiStep = (
    key: "drives" | "workStyle" | "lookingFor",
    dbColumn: "drives" | "work_style" | "looking_for",
    nextStep: number,
  ) => {
    persistAndAdvance({ [dbColumn]: profile[key] }, profile, nextStep);
  };

  const beyondCvError = beyondCvSchema.safeParse(profile.beyondCv).success
    ? null
    : profile.beyondCv.length > 0
      ? "Tell us a bit more, at least a couple sentences."
      : null;

  const continueBeyondCv = () => {
    const parsed = beyondCvSchema.safeParse(profile.beyondCv);
    if (!parsed.success) return;
    persistAndAdvance(
      { beyond_cv: parsed.data },
      { ...profile, beyondCv: parsed.data },
      TOTAL_STEPS,
    );
  };

  const goBack = () => {
    if (step <= 1) return;
    setStep(step - 1);
  };

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      await saveProfilePatch(supabase, userId, {
        profile_photo: publicUrl.publicUrl,
      });
      setProfile((prev) => ({ ...prev, profilePhoto: publicUrl.publicUrl }));
    } catch {
      setPhotoError(
        "Photo upload isn't set up yet — you can skip this for now and add it later.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loadState === "loading") return <ProfileWizardSkeleton />;
  if (loadState === "error") return <ProfileWizardError onRetry={retry} />;

  if (step >= TOTAL_STEPS) {
    return (
      <ProfilePreview
        profile={profile}
        userId={userId}
        supabase={supabase}
        onCvChanged={({ cvPath, cvFileName }) =>
          setProfile((prev) => ({ ...prev, cvPath, cvFileName }))
        }
      />
    );
  }

  const completionPct = profileCompletion(profile);
  const multiQuestion =
    step === 2
      ? PROFILE_QUESTIONS[0]
      : step === 3
        ? PROFILE_QUESTIONS[1]
        : step === 4
          ? PROFILE_QUESTIONS[2]
          : null;
  const multiKey: "drives" | "workStyle" | "lookingFor" | null =
    step === 2 ? "drives" : step === 3 ? "workStyle" : step === 4 ? "lookingFor" : null;
  const multiColumn: "drives" | "work_style" | "looking_for" | null =
    step === 2 ? "drives" : step === 3 ? "work_style" : step === 4 ? "looking_for" : null;
  const multiNextStep = step === 2 ? 3 : step === 3 ? 4 : 5;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16 sm:px-10">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={36} className="mb-6" />
          <CompletionMeter percent={completionPct} />
          <span className="mingle-gradient-text mt-5 font-display text-xs font-semibold uppercase tracking-[0.16em]">
            Build your mingle profile
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-mingle-white sm:text-3xl">
            {step === 1
              ? "Your CV tells your story"
              : multiQuestion
                ? multiQuestion.headline
                : "Beyond the CV"}
          </h1>
          <p className="mt-2 text-sm text-mingle-text-secondary">
            {step === 1
              ? "We want to know what comes next."
              : multiQuestion
                ? multiQuestion.subtext
                : "What should someone know about you before they meet you?"}
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
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First name" error={errors.firstName?.message}>
                    <input
                      {...register("firstName")}
                      className={inputClass}
                      placeholder="Yarin"
                    />
                  </Field>
                  <Field label="Last name" error={errors.lastName?.message}>
                    <input
                      {...register("lastName")}
                      className={inputClass}
                      placeholder="Cohen"
                    />
                  </Field>
                </div>

                <Field label="Professional title" error={errors.headline?.message}>
                  <input
                    {...register("headline")}
                    className={inputClass}
                    placeholder="Product Manager"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Current role" error={errors.currentRole?.message}>
                    <input
                      {...register("currentRole")}
                      className={inputClass}
                      placeholder="Senior PM"
                    />
                  </Field>
                  <Field label="Industry" error={errors.industry?.message}>
                    <input
                      {...register("industry")}
                      className={inputClass}
                      placeholder="Technology"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Location" error={errors.location?.message}>
                    <input
                      {...register("location")}
                      className={inputClass}
                      placeholder="Tel Aviv"
                    />
                  </Field>
                  <Field
                    label="Years of experience"
                    error={errors.yearsExperience?.message}
                  >
                    <input
                      type="number"
                      {...register("yearsExperience", { valueAsNumber: true })}
                      className={inputClass}
                      placeholder="5"
                    />
                  </Field>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                    Profile photo (optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {profile.profilePhoto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.profilePhoto}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <label className="cursor-pointer rounded-full bg-mingle-surface px-4 py-2 text-xs font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70">
                      {uploadingPhoto ? "Uploading…" : "Choose photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                  {photoError && (
                    <p className="mt-1.5 text-xs text-mingle-text-secondary">
                      {photoError}
                    </p>
                  )}
                </div>

                {userId && (
                  <TalentCvField
                    supabase={supabase}
                    userId={userId}
                    cvPath={profile.cvPath}
                    cvFileName={profile.cvFileName}
                    editable
                    onChanged={({ cvPath, cvFileName }) =>
                      setProfile((prev) => ({ ...prev, cvPath, cvFileName }))
                    }
                  />
                )}

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
              <div className="flex flex-col items-center">
                <textarea
                  value={profile.beyondCv}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, beyondCv: e.target.value }))
                  }
                  rows={6}
                  maxLength={2000}
                  placeholder="What should someone know about you before they meet you?"
                  className="w-full resize-none rounded-2xl border-2 border-mingle-surface bg-mingle-surface p-4 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none"
                />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {BEYOND_CV_SUB_PROMPTS.map((prompt) => (
                    <span
                      key={prompt}
                      className="rounded-full bg-mingle-surface px-3 py-1.5 text-xs text-mingle-text-secondary"
                    >
                      {prompt}
                    </span>
                  ))}
                </div>

                {beyondCvError && (
                  <p className="mt-4 text-center text-sm text-mingle-pink">
                    {beyondCvError}
                  </p>
                )}
                {saveError && (
                  <p className="mt-4 text-center text-sm text-mingle-pink">
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
                    onClick={continueBeyondCv}
                    disabled={!beyondCvSchema.safeParse(profile.beyondCv).success || saving}
                    whileHover={
                      beyondCvSchema.safeParse(profile.beyondCv).success
                        ? { scale: 1.03 }
                        : undefined
                    }
                    whileTap={
                      beyondCvSchema.safeParse(profile.beyondCv).success
                        ? { scale: 0.97 }
                        : undefined
                    }
                    className={`rounded-full px-8 py-3.5 font-display text-sm font-semibold transition-colors ${
                      beyondCvSchema.safeParse(profile.beyondCv).success
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

        {step > 1 && step !== 5 ? null : null}
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

function ProfileWizardSkeleton() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6">
      <MingleLogo variant="mark" size={48} className="animate-pulse" />
    </div>
  );
}

function ProfileWizardError({ onRetry }: { onRetry: () => void }) {
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
