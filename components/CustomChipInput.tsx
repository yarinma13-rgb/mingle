"use client";

import { useState } from "react";

export function CustomChipInput({
  disabled,
  onAdd,
  placeholder = "Not on the list? Add it",
}: {
  disabled?: boolean;
  onAdd: (value: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const next = value.trim();
    if (!next || disabled) return;
    onAdd(next);
    setValue("");
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <input
        type="text"
        value={value}
        disabled={disabled}
        maxLength={48}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
        className="min-w-0 flex-1 rounded-full border border-mingle-border bg-mingle-white px-4 py-2 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none disabled:opacity-40"
      />
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={submit}
        aria-label="Add"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mingle-cta text-lg font-semibold text-white disabled:bg-mingle-surface disabled:text-mingle-text-secondary/50"
      >
        +
      </button>
    </div>
  );
}