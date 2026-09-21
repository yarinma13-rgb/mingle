import type { ComponentPropsWithoutRef } from "react";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  className?: string;
};

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  className?: string;
};

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  className?: string;
};

/** Shared text input — white surface, subtle border, brand focus ring. */
export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={["mingle-input w-full px-4 py-2.5 text-sm", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={["mingle-input w-full px-4 py-3 text-sm", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={["mingle-input w-full px-3 py-2.5 text-sm", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}
