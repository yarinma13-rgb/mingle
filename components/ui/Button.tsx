"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "mingle-btn-primary",
  secondary: "mingle-btn-secondary",
  tertiary: "mingle-btn-tertiary",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
