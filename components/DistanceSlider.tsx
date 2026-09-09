"use client";

export function DistanceSlider({
  name = "distanceKm",
  value,
  onChange,
  max = 200,
  label = "Commute distance",
  hint,
}: {
  name?: string;
  value: number;
  onChange: (next: number) => void;
  max?: number;
  label?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
      {label}
      <input
        type="range"
        name={name}
        min={0}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(Number.parseInt(event.target.value, 10) || 0)
        }
        className="accent-mingle-accent-purple"
      />
      <span>
        {value
          ? hint ?? `Up to ${value} km`
          : "Any distance"}
      </span>
    </label>
  );
}
