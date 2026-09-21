import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "mingle-btn-primary",
  secondary: "mingle-btn-secondary",
  tertiary: "mingle-btn-tertiary",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "mingle-btn-sm",
  md: "",
  lg: "mingle-btn-lg",
};

function classes(
  variant: ButtonVariant,
  size: ButtonSize,
  className: string,
  block: boolean,
) {
  return [
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? "w-full" : "inline-flex items-center justify-center",
    "text-center disabled:opacity-60",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type Shared = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Stretch to full width of the parent. */
  block?: boolean;
  children: ReactNode;
};

type ButtonAsButton = Shared &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = Shared &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** Shared mingle button — primary gradient, secondary outline, tertiary text. */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    block = false,
    children,
  } = props;
  const classNames = classes(variant, size, className, block);

  if ("href" in props && props.href) {
    const {
      href,
      variant: _v,
      size: _s,
      className: _c,
      block: _b,
      children: _ch,
      ...linkProps
    } = props;
    return (
      <Link href={href} className={classNames} {...linkProps}>
        {children}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    className: _c,
    block: _b,
    children: _ch,
    type = "button",
    ...buttonProps
  } = props as ButtonAsButton;

  return (
    <button type={type} className={classNames} {...buttonProps}>
      {children}
    </button>
  );
}
