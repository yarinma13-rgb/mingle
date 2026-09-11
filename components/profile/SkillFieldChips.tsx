"use client";

import { SKILL_FIELDS } from "@/lib/skills/by-field";
import { SearchableCombobox } from "@/components/SearchableCombobox";

export function SkillFieldChips({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (field: string) => void;
}) {
  return (
    <div className="mb-4">
      <SearchableCombobox
        mode="single"
        label="Field"
        options={SKILL_FIELDS}
        value={selected}
        placeholder="Search fields"
        onSelect={(next) => {
          if (next) onSelect(next);
        }}
      />
    </div>
  );
}
