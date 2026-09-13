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
import { TalentPhotoField } from "@/components/profile/TalentPhotoField";
import { GenderField } from "@/components/profile/GenderField";
import { extractTalentCvAction } from "@/lib/profile/cv-extract-action";
import type { CvExtractResult } from "@/lib/profile/cv-extract";
import { personInitials, type Gender } from "@/lib/profile/avatar";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { CustomChipInput } from "@/components/CustomChipInput";
import { DistanceSlider } from "@/components/DistanceSlider";
import {
  addCustomCapped,
  extraChipValues,
  MAX_PROFILE_PICKS,
  toggleCapped,
} from "@/lib/profile/pick-limit";
import { PROFILE_QUESTIONS, BEYOND_CV_SUB_PROMPTS } from "@/lib/profile/questions";
import { SkillFieldChips } from "@/components/profile/SkillFieldChips";
import { SuggestInput } from "@/components/SuggestInput";
import { matchSkillField, skillOptionsForField } from "@/lib/skills/options";
import { saveTalentGithubUrlAction } from "@/lib/github/actions";
import {
  INDUSTRY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  TITLE_SUGGESTIONS,
} from "@/lib/suggest/lists";
import {
  loadProfile,
  saveProfilePatch,
  saveProfileCompletion,
  resumeStep,
  profileCompletion,
  EMPTY_PROFILE,
  type ProfileState,
} from "@/lib/profile/persistence";
import { syncProfileCoordinates } from "@/lib/geocoding/actions";
import {
  basicProfileSchema,
  beyondCvSchema,
  type BasicProfileValues,
} from "@/lib/validation/profile";
import { clampSalary, SALARY_MAX_MONTHLY_ILS } from "@/lib/profile/salary";
import type { Database } from "@/lib/supabase/types";

const TOTAL_STEPS = 7;

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
  const [cvExtractNote, setCvExtractNote] = useState<string | null>(null);
  const [cvExtracting, setCvExtracting] = useState(false);

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<BasicProfileValues>({
    resolver: zodResolver(basicProfileSchema),
    values: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      location: profile.location,
      yearsExperience: profile.yearsExperience,
      currentRole: profile.currentRole,
      industry: profile.industry,
      gender: profile.gender ?? undefined,
      birthDate: profile.birthDate ?? "",
    } as BasicProfileValues,
  });
  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");
  const watchedGender = watch("gender");
  const watchedBirthDate = watch("birthDate");
  const watchedIndustry = watch("industry");

  const persistAndAdvance = async (
    patch: Partial<{
      first_name: string;
      last_name: string;
      headline: string;
      location: string;
      years_experience: number | null;
      current_job_title: string;
      industry: string;
      profile_photo: string | null;
      drives: string[];
      work_style: string[];
      looking_for: string[];
      beyond_cv: string;
      gender: Gender | null;
      birth_date?: string | null;
      skills: string[];
      salary_expectation: number | null;
      max_commute_km: number | null;
    }>,
    nextProfile: ProfileState,
    nextStep: number,
  ) => {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveProfilePatch(supabase, userId, patch);
      if (typeof patch.location === "string") {
        void syncProfileCoordinates("talent", patch.location, profile.location);
      }
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
    const yearsExperience = values.yearsExperience ?? null;
    const gender = values.gender ?? null;
    const birthDate = values.birthDate?.trim() ? values.birthDate.trim() : null;
    const nextProfile: ProfileState = {
      ...profile,
      ...values,
      yearsExperience,
      gender,
      birthDate,
    };
    persistAndAdvance(
      {
        first_name: values.firstName,
        last_name: values.lastName,
        headline: values.headline,
        location: values.location,
        years_experience: yearsExperience,
        current_job_title: values.currentRole,
        industry: values.industry,
        gender,
        birth_date: birthDate,
      },
      nextProfile,
      2,
    );
  };

  const toggleMulti = (key: "drives" | "workStyle", option: string) => {
    setProfile((prev) => ({
      ...prev,
      [key]: toggleCapped(prev[key], option),
    }));
  };

  const continueMultiStep = (
    key: "drives" | "workStyle",
    dbColumn: "drives" | "work_style",
    nextStep: number,
  ) => {
    if (key === "drives") {
      // One values step feeds both match fields (drives + looking_for).
      const picks = profile.drives;
      persistAndAdvance(
        { drives: picks, looking_for: picks },
        { ...profile, drives: picks, lookingFor: picks },
        nextStep,
      );
      return;
    }
    persistAndAdvance(
      {
        work_style: profile.workStyle,
        max_commute_km: profile.maxCommuteKm || null,
      },
      profile,
      nextStep,
    );
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

  const applyCvExtract = (data: CvExtractResult) => {
    if (data.firstName) setValue("firstName", data.firstName, { shouldValidate: true });
    if (data.lastName) setValue("lastName", data.lastName, { shouldValidate: true });
    if (data.headline) setValue("headline", data.headline, { shouldValidate: true });
    if (data.currentRole) setValue("currentRole", data.currentRole, { shouldValidate: true });
    if (data.location) setValue("location", data.location, { shouldValidate: true });
    if (data.industry) setValue("industry", data.industry, { shouldValidate: true });
    if (typeof data.yearsExperience === "number") {
      setValue("yearsExperience", data.yearsExperience, { shouldValidate: true });
    }
    setProfile((prev) => ({
      ...prev,
      firstName: data.firstName || prev.firstName,
      lastName: data.lastName || prev.lastName,
      headline: data.headline || prev.headline,
      currentRole: data.currentRole || prev.currentRole,
      location: data.location || prev.location,
      industry: data.industry || prev.industry,
      yearsExperience:
        typeof data.yearsExperience === "number"
          ? data.yearsExperience
          : prev.yearsExperience,
      skills:
        data.skills && data.skills.length
          ? Array.from(new Set([...(prev.skills ?? []), ...data.skills])).slice(0, 20)
          : prev.skills,
      beyondCv: data.beyondCv || prev.beyondCv,
    }));
    setCvExtractNote(
      "We filled what we could from your CV. Edit anything before continuing.",
    );
  };

  const handleCvChanged = async (next: {
    cvPath: string | null;
    cvFileName: string | null;
  }) => {
    setProfile((prev) => ({ ...prev, ...next }));
    if (!next.cvPath) {
      setCvExtractNote(null);
      return;
    }
    setCvExtracting(true);
    setCvExtractNote("Reading your CV…");
    try {
      const result = await extractTalentCvAction(
        next.cvPath,
        watch("industry") || profile.industry,
      );
      if (result.ok) applyCvExtract(result.data);
      else setCvExtractNote(result.error);
    } catch {
      setCvExtractNote(
        "Could not read the CV automatically. You can still fill everything manually.",
      );
    } finally {
      setCvExtracting(false);
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
        onPhotoChanged={(photo) => {
          setProfile((prev) => {
            const updated = { ...prev, profilePhoto: photo };
            if (userId) {
              void saveProfileCompletion(
                supabase,
                userId,
                profileCompletion(updated),
              );
            }
            return updated;
          });
        }}
        onGenderChanged={(gender) => {
          const nextProfile = { ...profile, gender };
          setProfile(nextProfile);
          void persistAndAdvance({ gender }, nextProfile, TOTAL_STEPS);
        }}
        onEditStep={setStep}
      />
    );
  }

  const completionPct = profileCompletion(profile);
  const multiQuestion =
    step === 2 ? PROFILE_QUESTIONS[0] : step === 3 ? PROFILE_QUESTIONS[1] : null;
  const multiKey: "drives" | "workStyle" | null =
    step === 2 ? "drives" : step === 3 ? "workStyle" : null;
  const multiColumn: "drives" | "work_style" | null =
    step === 2 ? "drives" : step === 3 ? "work_style" : null;
  const multiNextStep = step === 2 ? 3 : 4;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16 sm:px-10">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={44} className="mb-6" />
          <CompletionMeter percent={completionPct} />
          <span className="mingle-gradient-text mt-5 font-display text-xs font-semibold uppercase tracking-[0.16em]">
            Build your mingle profile
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-mingle-text sm:text-3xl">
            {step === 1
              ? "Your CV tells your story"
              : multiQuestion
                ? multiQuestion.headline
                : step === 4
                  ? "Skills"
                  : step === 5
                    ? "Salary expectation"
                    : "Beyond the CV"}
          </h1>
          <p className="mt-2 text-sm text-mingle-text-secondary">
            {step === 1
              ? "We want to know what comes next."
              : multiQuestion
                ? multiQuestion.subtext
                : step === 4
                  ? "Technologies and craft. Add your own if it is not listed."
                  : step === 6
                    ? "Private. Companies never see the number, only whether you fit a role budget."
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field required label="First name" error={errors.firstName?.message}>
                    <input
                      {...register("firstName")}
                      className={inputClass}
                      placeholder=""
                    />
                  </Field>
                  <Field required label="Last name" error={errors.lastName?.message}>
                    <input
                      {...register("lastName")}
                      className={inputClass}
                      placeholder=""
                    />
                  </Field>
                </div>

                <Field required label="Professional title" error={errors.headline?.message}>
                  <SuggestInput
                    {...register("headline")}
                    listId="talent-headline"
                    suggestions={TITLE_SUGGESTIONS}
                    className={inputClass}
                    placeholder=""
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field required label="Current role" error={errors.currentRole?.message}>
                    <SuggestInput
                      {...register("currentRole")}
                      listId="talent-current-role"
                      suggestions={TITLE_SUGGESTIONS}
                      className={inputClass}
                      placeholder=""
                    />
                  </Field>
                  <Field required label="Industry" error={errors.industry?.message}>
                    <SuggestInput
                      {...register("industry")}
                      listId="talent-industry"
                      suggestions={INDUSTRY_SUGGESTIONS}
                      className={inputClass}
                      placeholder=""
                    />
                    <div className="mt-3">
                      <SkillFieldChips
                        selected={matchSkillField(watchedIndustry)}
                        onSelect={(field) =>
                          setValue("industry", field, { shouldValidate: true })
                        }
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Location" error={errors.location?.message}>
                    <SuggestInput
                      {...register("location")}
                      listId="talent-location"
                      suggestions={LOCATION_SUGGESTIONS}
                      className={inputClass}
                      placeholder=""
                    />
                  </Field>
                  <Field
                    label="Years of experience"
                    error={errors.yearsExperience?.message}
                  >
                    <select
                      {...register("yearsExperience", {
                        setValueAs: (value) =>
                          value === "" || value == null ? null : Number(value),
                      })}
                      className={inputClass}
                    >
                      <option value="">Prefer not to say</option>
                      {Array.from({ length: 41 }, (_, years) => (
                        <option key={years} value={years}>
                          {years}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <GenderField
                  value={watchedGender}
                  birthDate={watchedBirthDate ?? ""}
                  error={errors.gender?.message}
                  birthDateError={errors.birthDate?.message}
                  onChange={(gender) =>
                    setValue("gender", gender, { shouldValidate: true })
                  }
                  onBirthDateChange={(birthDate) =>
                    setValue("birthDate", birthDate, { shouldValidate: true })
                  }
                />

                {userId ? (
                  <TalentPhotoField
                    supabase={supabase}
                    userId={userId}
                    photo={profile.profilePhoto}
                    initials={personInitials(
                      watchedFirstName ?? "",
                      watchedLastName ?? "",
                    )}
                    gender={watchedGender ?? profile.gender}
                    onChanged={(next) => {
                      setProfile((prev) => {
                        const updated = { ...prev, profilePhoto: next };
                        void saveProfileCompletion(
                          supabase,
                          userId,
                          profileCompletion(updated),
                        );
                        return updated;
                      });
                    }}
                  />
                ) : (
                  <p className="text-xs text-mingle-text-secondary">
                    Sign in to add a profile photo.
                  </p>
                )}

                {userId ? (
                  <div className="flex flex-col gap-2">
                    <TalentCvField
                      supabase={supabase}
                      userId={userId}
                      cvPath={profile.cvPath}
                      cvFileName={profile.cvFileName}
                      editable
                      onChanged={(next) => {
                        void handleCvChanged(next);
                      }}
                    />
                    {cvExtractNote ? (
                      <p className="rounded-[12px] border border-mingle-border bg-mingle-lavender/40 px-3 py-2 text-xs text-mingle-text-secondary">
                        {cvExtracting ? "Reading your CV…" : cvExtractNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}

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
                  className="mingle-btn-primary mt-2 text-sm disabled:opacity-60"
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
                  {[
                    ...multiQuestion.options,
                    ...extraChipValues(profile[multiKey], multiQuestion.options),
                  ].map((option) => {
                    const selected = profile[multiKey].includes(option);
                    const atCap =
                      profile[multiKey].length >= MAX_PROFILE_PICKS && !selected;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        disabled={atCap}
                        onClick={() => toggleMulti(multiKey, option)}
                        className={`rounded-[10px] border px-4 py-2.5 text-sm font-medium transition-colors ${
                          selected
                            ? "border-mingle-blue bg-mingle-lavender text-mingle-text"
                            : atCap
                              ? "cursor-not-allowed border-mingle-border bg-mingle-white text-mingle-text-secondary/40"
                              : "border-mingle-border bg-mingle-white text-mingle-text-secondary hover:border-mingle-blue/50"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <CustomChipInput
                  disabled={profile[multiKey].length >= MAX_PROFILE_PICKS}
                  onAdd={(value) =>
                    setProfile((prev) => ({
                      ...prev,
                      [multiKey]: addCustomCapped(
                        prev[multiKey],
                        value,
                        MAX_PROFILE_PICKS,
                        multiQuestion.options,
                      ),
                    }))
                  }
                />
                <p className="mt-3 text-center text-xs text-mingle-text-secondary">
                  {profile[multiKey].length} of {MAX_PROFILE_PICKS} selected
                </p>
                {multiKey === "workStyle" ? (
                  <div className="mt-6">
                    <DistanceSlider
                      name="maxCommuteKm"
                      value={profile.maxCommuteKm}
                      onChange={(maxCommuteKm) =>
                        setProfile((prev) => ({ ...prev, maxCommuteKm }))
                      }
                      label="How far are you willing to commute"
                      hint={
                        profile.maxCommuteKm
                          ? `Up to ${profile.maxCommuteKm} km from home`
                          : "Any distance"
                      }
                    />
                  </div>
                ) : null}

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
                    className="mingle-btn-secondary disabled:opacity-50"
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
                    className={`font-display text-sm ${
                      profile[multiKey].length > 0
                        ? "mingle-btn-primary"
                        : "mingle-btn-secondary cursor-not-allowed opacity-45"
                    }`}
                  >
                    {saving ? "Saving…" : "Continue"}
                  </motion.button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <SkillFieldChips
                  selected={matchSkillField(profile.industry)}
                  onSelect={(field) =>
                    setProfile((prev) => ({ ...prev, industry: field }))
                  }
                />
                <ChipMultiSelect
                  label="Skills"
                  chipStyle="square"
                  options={skillOptionsForField(profile.industry)}
                  selected={profile.skills}
                  onChange={(skills) =>
                    setProfile((prev) => ({ ...prev, skills }))
                  }
                />
                <label className="mt-8 block text-sm font-medium text-mingle-text">
                  GitHub profile{" "}
                  <span className="font-normal text-mingle-text-secondary">
                    (optional · leaving blank does not hurt your score)
                  </span>
                  <input
                    type="url"
                    value={profile.githubUrl ?? ""}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        githubUrl: event.target.value,
                      }))
                    }
                    placeholder="https://github.com/username"
                    className="mt-2 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm outline-none focus:border-mingle-pink"
                  />
                </label>
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
                    className="mingle-btn-secondary disabled:opacity-50"
                  >
                    Back
                  </button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        const githubResult = await saveTalentGithubUrlAction(
                          profile.githubUrl ?? "",
                        );
                        if (!githubResult.ok) {
                          setSaveError(githubResult.error);
                          return;
                        }
                        const nextProfile = {
                          ...profile,
                          githubUrl: githubResult.githubUrl,
                          githubLogin: githubResult.githubLogin,
                        };
                        await persistAndAdvance(
                          {
                            skills: nextProfile.skills,
                            industry: nextProfile.industry,
                          },
                          nextProfile,
                          5,
                        );
                      })();
                    }}
                    disabled={profile.skills.length === 0 || saving}
                    className={`font-display text-sm ${
                      profile.skills.length > 0
                        ? "mingle-btn-primary"
                        : "mingle-btn-secondary cursor-not-allowed opacity-45"
                    }`}
                  >
                    {saving ? "Saving…" : "Continue"}
                  </motion.button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                  Monthly salary in ILS. Optional. Capped at{" "}
                  {SALARY_MAX_MONTHLY_ILS.toLocaleString("en-US")}.
                </label>
                <input
                  type="number"
                  min={1}
                  max={SALARY_MAX_MONTHLY_ILS}
                  value={profile.salaryExpectation ?? ""}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      salaryExpectation: event.target.value
                        ? clampSalary(
                            Number.parseInt(event.target.value, 10),
                          )
                        : null,
                    }))
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
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
                    className="mingle-btn-secondary disabled:opacity-50"
                  >
                    Back
                  </button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      const salaryExpectation = clampSalary(
                        profile.salaryExpectation,
                      );
                      persistAndAdvance(
                        { salary_expectation: salaryExpectation },
                        { ...profile, salaryExpectation },
                        6,
                      );
                    }}
                    disabled={saving}
                    className="mingle-btn-primary font-display text-sm"
                  >
                    {saving ? "Saving…" : "Continue"}
                  </motion.button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-col items-center">
                <textarea
                  value={profile.beyondCv}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, beyondCv: e.target.value }))
                  }
                  rows={6}
                  maxLength={2000}
                  placeholder="What should someone know about you before they meet you?"
                  className="w-full resize-none rounded-[16px] border border-mingle-border bg-mingle-white p-4 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
                />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {BEYOND_CV_SUB_PROMPTS.map((prompt) => (
                    <span
                      key={prompt}
                      className="rounded-[10px] bg-mingle-lavender px-3 py-1.5 text-xs text-mingle-text-secondary"
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
                    className="mingle-btn-secondary disabled:opacity-50"
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
                    className={`font-display text-sm ${
                      beyondCvSchema.safeParse(profile.beyondCv).success
                        ? "mingle-btn-primary"
                        : "mingle-btn-secondary cursor-not-allowed opacity-45"
                    }`}
                  >
                    {saving ? "Saving…" : "See my profile"}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step > 1 && step !== 7 ? null : null}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-3 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none";

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
        {label}
        {required ? <span className="text-mingle-pink"> *</span> : null}
        <span className="mt-1.5 block font-normal">{children}</span>
      </label>
      {error && <p className="mt-1 text-xs text-mingle-error">{error}</p>}
    </div>
  );
}

function CompletionMeter({ percent }: { percent: number }) {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-mingle-lavender">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-mingle-pink via-mingle-purple to-mingle-blue"
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
      <MingleLogo variant="mark" size={58} className="animate-pulse" />
    </div>
  );
}

function ProfileWizardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <MingleLogo variant="mark" size={44} />
      <p className="max-w-xs text-sm text-mingle-text-secondary">
        Something went wrong loading your profile.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mingle-btn-secondary"
      >
        Try again
      </button>
    </div>
  );
}
