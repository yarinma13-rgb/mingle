"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { chipTextError } from "@/lib/validation/chip";

export function SearchableCombobox({
  options,
  value,
  values,
  onSelect,
  onChange,
  mode = "single",
  label,
  placeholder = "Search or type to add",
  emptyLabel = "No matches. Press Enter to add yours.",
  max,
  chipStyle = "pill",
  allowCustom = true,
}: {
  options: readonly string[];
  value?: string | null;
  values?: string[];
  onSelect?: (next: string | null) => void;
  onChange?: (next: string[]) => void;
  mode?: "single" | "multiple";
  label?: string;
  placeholder?: string;
  emptyLabel?: string;
  max?: number;
  chipStyle?: "pill" | "square";
  allowCustom?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectedValues = useMemo(
    () => (mode === "multiple" ? (values ?? []) : []),
    [mode, values],
  );
  const selectedSingle = mode === "single" ? (value ?? null) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? options.filter((option) => option.toLowerCase().includes(q))
      : [...options];
    if (mode === "multiple") {
      return base.filter((option) => !selectedValues.includes(option));
    }
    return base;
  }, [options, query, mode, selectedValues]);

  const canAddCustom =
    allowCustom &&
    query.trim().length > 0 &&
    !options.some(
      (option) => option.toLowerCase() === query.trim().toLowerCase(),
    ) &&
    (mode === "single" ||
      !selectedValues.some(
        (entry) => entry.toLowerCase() === query.trim().toLowerCase(),
      ));

  const menuItems = canAddCustom
    ? [...filtered, `__custom__:${query.trim()}`]
    : filtered;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function commitSingle(next: string) {
    onSelect?.(next);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
    setError(null);
  }

  function commitMultiple(next: string) {
    if (max != null && selectedValues.length >= max) return;
    if (selectedValues.includes(next)) return;
    onChange?.([...selectedValues, next]);
    setQuery("");
    setActiveIndex(0);
    setError(null);
    setOpen(true);
    inputRef.current?.focus();
  }

  function addCustom() {
    const next = query.trim();
    if (!next) return;
    const problem = chipTextError(next);
    if (problem) {
      setError(problem);
      return;
    }
    if (mode === "single") commitSingle(next);
    else commitMultiple(next);
  }

  function chooseItem(item: string) {
    if (item.startsWith("__custom__:")) {
      addCustom();
      return;
    }
    if (mode === "single") commitSingle(item);
    else commitMultiple(item);
  }

  function removeValue(item: string) {
    if (mode === "single") {
      onSelect?.(null);
      return;
    }
    onChange?.(selectedValues.filter((entry) => entry !== item));
  }

  const chipClass =
    chipStyle === "square"
      ? "rounded-[10px] border px-3 py-1.5 text-xs font-medium"
      : "rounded-full border-2 px-3 py-1.5 text-xs font-medium";

  const atCap =
    mode === "multiple" && max != null && selectedValues.length >= max;

  return (
    <div ref={rootRef} className="w-full">
      {label ? (
        <p className="mb-2 text-xs font-medium text-mingle-text-secondary">
          {label}
        </p>
      ) : null}

      {mode === "single" && selectedSingle ? (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          <span
            className={`${chipClass} inline-flex items-center gap-1.5 border-mingle-blue bg-mingle-lavender text-mingle-text`}
          >
            {selectedSingle}
            <button
              type="button"
              aria-label={`Remove ${selectedSingle}`}
              onClick={() => removeValue(selectedSingle)}
              className="rounded-full px-1 text-mingle-text-secondary hover:text-mingle-text"
            >
              ×
            </button>
          </span>
        </div>
      ) : null}

      {mode === "multiple" && selectedValues.length > 0 ? (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {selectedValues.map((item) => (
            <span
              key={item}
              className={`${chipClass} inline-flex items-center gap-1.5 border-mingle-blue bg-mingle-lavender text-mingle-text`}
            >
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => removeValue(item)}
                className="rounded-full px-1 text-mingle-text-secondary hover:text-mingle-text"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={label ?? placeholder}
          disabled={atCap}
          value={query}
          placeholder={atCap ? `Limit of ${max} reached` : placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setError(null);
            setOpen(true);
          }}
          onFocus={() => {
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) =>
                menuItems.length === 0 ? 0 : (index + 1) % menuItems.length,
              );
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) =>
                menuItems.length === 0
                  ? 0
                  : (index - 1 + menuItems.length) % menuItems.length,
              );
              return;
            }
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (open && menuItems[activeIndex]) {
                chooseItem(menuItems[activeIndex]);
              } else if (canAddCustom) {
                addCustom();
              }
            }
          }}
          className="w-full rounded-full border border-mingle-border bg-mingle-white px-4 py-2.5 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none disabled:opacity-40"
        />

        {open && !atCap ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-mingle-border bg-mingle-white p-1.5 shadow-[0_12px_40px_rgba(28,27,46,0.12)]"
          >
            {menuItems.length === 0 ? (
              <li className="px-3 py-2.5 text-center text-sm text-mingle-text-secondary">
                {emptyLabel}
              </li>
            ) : (
              menuItems.map((item, index) => {
                const isCustom = item.startsWith("__custom__:");
                const labelText = isCustom ? `Add “${query.trim()}”` : item;
                return (
                  <li
                    key={item}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseItem(item)}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        index === activeIndex
                          ? "bg-mingle-lavender text-mingle-text"
                          : "text-mingle-text hover:bg-mingle-surface"
                      }`}
                    >
                      {labelText}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1.5 text-center text-xs text-mingle-pink">{error}</p>
      ) : null}

      {mode === "multiple" && max != null ? (
        <p className="mt-3 text-center text-xs text-mingle-text-secondary">
          {selectedValues.length} of {max} selected
        </p>
      ) : null}
    </div>
  );
}
