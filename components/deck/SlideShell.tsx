"use client";

import type { ReactNode } from "react";

export function SlideShell({
  kicker,
  title,
  subtitle,
  children,
  compact,
  className = "",
  titleDir,
}: {
  kicker?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  compact?: boolean;
  className?: string;
  titleDir?: "ltr" | "rtl";
}) {
  return (
    <div className={`deck-slide-inner ${compact ? "compact" : ""} ${className}`.trim()}>
      {(kicker || title || subtitle) && (
        <header>
          {kicker ? <p className="deck-kicker">{kicker}</p> : null}
          {title ? (
            <h1 className="deck-title" dir={titleDir}>
              {title}
            </h1>
          ) : null}
          {subtitle ? <p className="deck-subtitle">{subtitle}</p> : null}
        </header>
      )}
      <div className="deck-visual">{children}</div>
    </div>
  );
}

export function FlowArrow() {
  return <div className="deck-connector" aria-hidden />;
}

export function FlowNode({
  title,
  caption,
  tone = "white",
}: {
  title: string;
  caption?: string;
  tone?: "white" | "pink" | "purple" | "blue" | "gradient";
}) {
  const style =
    tone === "pink"
      ? { background: "var(--deck-light-pink)" }
      : tone === "purple"
        ? { background: "var(--deck-light-purple)" }
        : tone === "blue"
          ? { background: "var(--deck-light-blue)" }
          : tone === "gradient"
            ? {
                background: "var(--deck-gradient)",
                color: "white",
                border: "none",
              }
            : undefined;

  return (
    <div className="deck-node" style={style}>
      <strong style={tone === "gradient" ? { color: "white" } : undefined}>
        {title}
      </strong>
      {caption ? (
        <span style={tone === "gradient" ? { color: "rgba(255,255,255,0.85)" } : undefined}>
          {caption}
        </span>
      ) : null}
    </div>
  );
}
