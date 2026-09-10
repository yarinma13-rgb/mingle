"use client";

import {
  addCustomCapped,
  extraChipValues,
  MAX_PROFILE_PICKS,
  toggleCapped,
} from "@/lib/profile/pick-limit";
import { CustomChipInput } from "@/components/CustomChipInput";

const ACCENT_SELECTED: Record<"pink" | "purple" | "blue" | "violet", string> = {
  pink: "border-mingle-accent-pink bg-[color-mix(in_srgb,var(--mingle-accent-pink)_12%,white)] text-mingle-text",
  purple:
    "border-mingle-accent-purple bg-[color-mix(in_srgb,var(--mingle-accent-purple)_12%,white)] text-mingle-text",
  blue: "border-mingle-accent-blue bg-mingle-lavender text-mingle-text",
  violet:
    "border-mingle-accent-violet bg-[color-mix(in_srgb,var(--mingle-accent-violet)_12%,white)] text-mingle-text",
};

export function ChipMultiSelect({
  options,
  selected,
  onChange,
  max = MAX_PROFILE_PICKS,
  label,
  chipStyle = "pill",
  accent = "blue",
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
  chipStyle?: "pill" | "square";
  /** Category color: skills blue, drives pink, work style violet. */
  accent?: "pink" | "purple" | "blue" | "violet";
}) {
  const visible = [...options, ...extraChipValues(selected, options)];
  const chipClass =
    chipStyle === "square"
      ? "rounded-[10px] border px-4 py-2.5 text-sm font-medium transition-colors"
      : "rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors";

  return (
    <div>
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap justify-center gap-2.5"
      >
        {visible.map((option) => {
          const isSelected = selected.includes(option);
          const atCap = selected.length >= max && !isSelected;
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={atCap}
              onClick={() => onChange(toggleCapped(selected, option, max))}
              className={`${chipClass} ${
                isSelected
                  ? ACCENT_SELECTED[accent]
                  : atCap
                    ? "cursor-not-allowed border-mingle-surface bg-mingle-surface text-mingle-text-secondary/40"
                    : "border-mingle-surface bg-mingle-surface text-mingle-text-secondary hover:border-mingle-blue/50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <CustomChipInput
        disabled={selected.length >= max}
        onAdd={(value) =>
          onChange(addCustomCapped(selected, value, max, options))
        }
      />
      <p className="mt-3 text-center text-xs text-mingle-text-secondary">
        {selected.length} of {max} selected
      </p>
    </div>
  );
}
