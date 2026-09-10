import { SKILL_FIELDS } from "@/lib/skills/by-field";

export function SkillFieldChips({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (field: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium text-mingle-text-secondary">
        Field
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SKILL_FIELDS.map((field) => {
          const isOn = selected === field;
          return (
            <button
              key={field}
              type="button"
              onClick={() => onSelect(field)}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                isOn
                  ? "border-mingle-blue bg-mingle-lavender text-mingle-text"
                  : "border-mingle-surface bg-mingle-surface text-mingle-text-secondary hover:border-mingle-blue/50"
              }`}
            >
              {field}
            </button>
          );
        })}
      </div>
    </div>
  );
}
