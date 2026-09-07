"use client";

import { GENDER_OPTIONS, type Gender } from "@/lib/profile/avatar";

export function GenderField({
  value,
  error,
  onChange,
}: {
  value: Gender | null | undefined;
  error?: string;
  onChange: (value: Gender) => void;
}) {
  return (
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
      {error && <p className="mt-1.5 text-xs text-mingle-pink">{error}</p>}
    </fieldset>
  );
}
