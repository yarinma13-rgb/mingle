"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.5M19.5 12H21M4.9 19.1 6 18M18 6l1.1-1.1" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16.5 3.5A8.5 8.5 0 1 0 20.5 14 6.5 6.5 0 0 1 16.5 3.5Z" />
    </svg>
  );
}

export function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`flex items-center gap-2 ${compact ? "flex-row" : "flex-col"}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Dark mode"
        onClick={toggleTheme}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[180ms] ease-out"
        style={{
          backgroundColor: isDark
            ? "var(--mingle-accent-purple)"
            : "var(--mingle-border)",
        }}
      >
        <MoonIcon
          className={`pointer-events-none absolute left-[5px] top-1/2 -translate-y-1/2 ${
            isDark ? "text-white" : "text-transparent"
          }`}
        />
        <SunIcon
          className={`pointer-events-none absolute right-[5px] top-1/2 -translate-y-1/2 ${
            isDark ? "text-transparent" : "text-mingle-text-secondary"
          }`}
        />
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,20,32,0.28)] transition-transform duration-[180ms] ease-out"
          style={{ transform: isDark ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
      <span className="text-center text-[10px] font-medium leading-tight text-mingle-nav-idle">
        Dark mode
      </span>
    </div>
  );
}
