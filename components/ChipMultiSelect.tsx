"use client";

import {
  addCustomCapped,
  extraChipValues,
  MAX_PROFILE_PICKS,
  toggleCapped,
} from "@/lib/profile/pick-limit";
import { CustomChipInput } from "@/components/CustomChipInput";

export function ChipMultiSelect({
  options,
  selected,
  onChange,
  max = MAX_PROFILE_PICKS,
  label,
  chipStyle = "pill",
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
  chipStyle?: "pill" | "square";
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
                  ? "border-mingle-blue bg-mingle-lavender text-mingle-text"
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
        onAdd={(value) => onChange(addCustomCapped(selected, value, max, options))}
      />
      <p className="mt-3 text-center text-xs text-mingle-text-secondary">
        {selected.length} of {max} selected
      </p>
    </div>
  );
}
