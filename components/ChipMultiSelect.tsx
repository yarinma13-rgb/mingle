"use client";

import {
  MAX_PROFILE_PICKS,
} from "@/lib/profile/pick-limit";
import { SearchableCombobox } from "@/components/SearchableCombobox";

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
  return (
    <SearchableCombobox
      mode="multiple"
      label={label}
      options={options}
      values={selected}
      onChange={onChange}
      max={max}
      chipStyle={chipStyle}
      placeholder="Search or add a skill"
      allowCustom
    />
  );
}
