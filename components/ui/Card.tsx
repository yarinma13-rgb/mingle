import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  interactive = false,
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`mingle-card ${interactive ? "mingle-card-interactive" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
