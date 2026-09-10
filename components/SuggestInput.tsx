"use client";

import type { InputHTMLAttributes } from "react";

type SuggestInputProps = InputHTMLAttributes<HTMLInputElement> & {
  listId: string;
  suggestions: readonly string[];
};

export function SuggestInput({
  listId,
  suggestions,
  className,
  ...props
}: SuggestInputProps) {
  return (
    <>
      <input {...props} list={listId} autoComplete="off" className={className} />
      <datalist id={listId}>
        {suggestions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </>
  );
}
