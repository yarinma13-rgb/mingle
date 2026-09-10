"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { clampSalary, SALARY_MAX_MONTHLY_ILS } from "@/lib/profile/salary";
import {
  ROLE_DEPARTMENT_OPTIONS,
  ROLE_EMPLOYMENT_OPTIONS,
  ROLE_SENIORITY_OPTIONS,
  ROLE_SKILL_OPTIONS,
  ROLE_TITLE_SUGGESTIONS,
  WORK_MODEL_OPTIONS,
} from "@/lib/roles/questions";
import {
  createCompanyRole,
  isMissingRolesTable,
  updateCompanyRole,
  type RoleDraft,
  type RoleRecord,
} from "@/lib/roles/persistence";
import { roleDraftSchema } from "@/lib/validation/role";
import type { Database } from "@/lib/supabase/types";

const TOTAL_STEPS = 6;

const STEP_COPY: { headline: string; subtext: string }[] = [
  {
    headline: "What are you hiring for",
    subtext: "Pick a department, then tap a title or type your own.",
  },
  {
    headline: "Level and type",
    subtext: "Seniority and how this person is hired.",
  },
  {
    headline: "Where they work",
    subtext: "Same work models you already use in Discover.",
  },
  {
    headline: "Skills that matter",
    subtext: "Up to five. You can always edit later.",
  },
  {
    headline: "Role budget",
    subtext: "Private. Candidates never see the numbers, only a salary fit tag.",
  },
  {
    headline: "A few words",
    subtext: "Optional. Skip if the title already says enough.",
  },
];

function Chip({
  selected,
  disabled,
  children,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "border-mingle-blue bg-mingle-lavender text-mingle-text"
          : disabled
            ? "cursor-not-allowed border-mingle-surface bg-mingle-surface text-mingle-text-secondary/40"
            : "border-mingle-surface bg-mingle-surface text-mingle-text-secondary hover:border-mingle-blue/50"
      }`}
    >
      {children}
    </button>
  );
}

export function RoleBuilder({
  supabase,
  companyId,
  initialDraft,
  editingId,
  onCancel,
  onSaved,
}: {
  supabase: SupabaseClient<Database>;
  companyId: string;
  initialDraft: RoleDraft;
  editingId: string | null;
  onCancel: () => void;
  onSaved: (role: RoleRecord) => void;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<RoleDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = STEP_COPY[step - 1];
  const titleSuggestions = draft.department
    ? (ROLE_TITLE_SUGGESTIONS[draft.department] ?? [])
    : [];

  const canContinue =
    step === 1
      ? Boolean(draft.title.trim() && draft.department)
      : step === 2
        ? Boolean(draft.seniority && draft.employmentType)
        : step === 3
          ? Boolean(draft.workModel)
          : true;

  async function finish() {
    const parsed = roleDraftSchema.safeParse({
      ...draft,
      salaryMin: clampSalary(draft.salaryMin),
      salaryMax: clampSalary(draft.salaryMax),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the role details");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = editingId
        ? await updateCompanyRole(supabase, editingId, companyId, {
            ...parsed.data,
            sourceJd: draft.sourceJd,
            sourceUrl: draft.sourceUrl,
          })
        : await createCompanyRole(supabase, companyId, {
            ...parsed.data,
            sourceJd: draft.sourceJd,
            sourceUrl: draft.sourceUrl,
          });
      onSaved(saved);
    } catch (caught) {
      const missing = isMissingRolesTable(
        caught && typeof caught === "object" ? (caught as { message?: string; code?: string }) : null,
      );
      setError(
        missing
          ? "Roles are not in the database yet. Run supabase/migrations/0014_company_roles.sql in the Supabase SQL Editor."
          : "Could not save this role. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg py-4">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 w-8 rounded-full ${
                index < step ? "bg-mingle-cta" : "bg-mingle-surface"
              }`}
            />
          ))}
        </div>
        <span className="mingle-gradient-text font-display text-xs font-semibold uppercase tracking-[0.16em]">
          {editingId ? "Edit role" : "Create role"}
        </span>
        <h2 className="mt-2 font-display text-2xl font-bold text-mingle-text">
          {copy.headline}
        </h2>
        <p className="mt-2 text-sm text-mingle-text-secondary">{copy.subtext}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-medium text-mingle-text-secondary">
                  Department
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_DEPARTMENT_OPTIONS.map((option) => (
                    <Chip
                      key={option}
                      selected={draft.department === option}
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, department: option }))
                      }
                    >
                      {option}
                    </Chip>
                  ))}
                </div>
              </div>
              {titleSuggestions.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-mingle-text-secondary">
                    Suggested titles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {titleSuggestions.map((option) => (
                      <Chip
                        key={option}
                        selected={draft.title === option}
                        onClick={() =>
                          setDraft((prev) => ({ ...prev, title: option }))
                        }
                      >
                        {option}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                  Role title
                </span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                  maxLength={120}
                  placeholder="Software engineer"
                  className="w-full rounded-2xl border border-mingle-border bg-mingle-white px-4 py-3 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2 text-xs font-medium text-mingle-text-secondary">
                  Seniority
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_SENIORITY_OPTIONS.map((option) => (
                    <Chip
                      key={option}
                      selected={draft.seniority === option}
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, seniority: option }))
                      }
                    >
                      {option}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-mingle-text-secondary">
                  Employment type
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_EMPLOYMENT_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      selected={draft.employmentType === option.value}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          employmentType: option.value,
                        }))
                      }
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-wrap gap-2">
              {WORK_MODEL_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  selected={draft.workModel === option}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, workModel: option }))
                  }
                >
                  {option}
                </Chip>
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <ChipMultiSelect
              label="Required skills"
              options={ROLE_SKILL_OPTIONS}
              selected={draft.requiredSkills}
              onChange={(requiredSkills) =>
                setDraft((prev) => ({ ...prev, requiredSkills }))
              }
            />
          ) : null}

          {step === 5 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                  Min (monthly ILS)
                </span>
                <input
                  type="number"
                  min={1}
                  max={SALARY_MAX_MONTHLY_ILS}
                  value={draft.salaryMin ?? ""}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      salaryMin: event.target.value
                        ? clampSalary(
                            Number.parseInt(event.target.value, 10),
                          )
                        : null,
                    }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-mingle-border bg-mingle-white px-4 py-3 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                  Max (monthly ILS)
                </span>
                <input
                  type="number"
                  min={1}
                  max={SALARY_MAX_MONTHLY_ILS}
                  value={draft.salaryMax ?? ""}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      salaryMax: event.target.value
                        ? clampSalary(
                            Number.parseInt(event.target.value, 10),
                          )
                        : null,
                    }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-mingle-border bg-mingle-white px-4 py-3 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
                />
              </label>
            </div>
          ) : null}

          {step === 6 ? (
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={5}
              maxLength={1200}
              placeholder="What this person will own, and who they will work with"
              className="w-full resize-none rounded-2xl border border-mingle-border bg-mingle-white p-4 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {error ? (
        <p className="mt-6 text-center text-sm text-mingle-pink">{error}</p>
      ) : null}

      <div className="mt-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (step === 1) onCancel();
            else setStep((prev) => prev - 1);
          }}
          disabled={saving}
          className="rounded-full bg-mingle-surface px-6 py-3.5 font-display text-sm font-semibold text-mingle-text transition-colors hover:bg-mingle-surface/70 disabled:opacity-50"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        <motion.button
          type="button"
          disabled={!canContinue || saving}
          whileHover={canContinue ? { scale: 1.03 } : undefined}
          whileTap={canContinue ? { scale: 0.97 } : undefined}
          onClick={() => {
            if (step < TOTAL_STEPS) setStep((prev) => prev + 1);
            else void finish();
          }}
          className={`rounded-full px-8 py-3.5 font-display text-sm font-semibold transition-colors ${
            canContinue
              ? "bg-mingle-cta text-white"
              : "cursor-not-allowed bg-mingle-surface text-mingle-text-secondary/50"
          }`}
        >
          {saving
            ? "Saving…"
            : step === TOTAL_STEPS
              ? editingId
                ? "Save role"
                : "Create role"
              : "Continue"}
        </motion.button>
      </div>
    </div>
  );
}
