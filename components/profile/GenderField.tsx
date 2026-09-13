"use client";

import { GENDER_OPTIONS, type Gender } from "@/lib/profile/avatar";

export function GenderField({
  value,
  birthDate,
  error,
  birthDateError,
  onChange,
  onBirthDateChange,
}: {
  value: Gender | null | undefined;
  birthDate?: string | null;
  error?: string;
  birthDateError?: string;
  onChange: (value: Gender) => void;
  onBirthDateChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
          Gender
        </legend>
        <div className="flex flex-col gap-2">
          {GENDER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-mingle-text"
            >
              <input
                type="radio"
                name="gender"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="accent-mingle-purple"
              />
              {option.label}
            </label>
          ))}
        </div>
        {error ? <p className="mt-1.5 text-xs text-mingle-pink">{error}</p> : null}
      </fieldset>

      {onBirthDateChange ? (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
            Date of birth
          </span>
          <input
            type="date"
            value={birthDate ?? ""}
            onChange={(event) => onBirthDateChange(event.target.value)}
            className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-3 py-2.5 text-sm text-mingle-text focus:border-mingle-blue focus:outline-none"
          />
          <span className="mt-1.5 block text-[11px] leading-relaxed text-mingle-text-secondary">
            Only for registration — this stays private and is not shown on your
            profile.
          </span>
          {birthDateError ? (
            <p className="mt-1.5 text-xs text-mingle-pink">{birthDateError}</p>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}
