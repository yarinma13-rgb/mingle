"use client";

import { useState, useTransition } from "react";
import type { MatchReport } from "@/lib/matching/report";
import type { MatchNarration } from "@/lib/matching/narrate-match";
import { narrateMatchAction } from "@/lib/matching/learning-actions";

/** Optional Gemini narration — never changes the score. */
export function MatchNarrationPanel({ report }: { report: MatchReport }) {
  const [narration, setNarration] = useState<MatchNarration | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await narrateMatchAction(report);
        setNarration(result);
      } catch {
        setError("Couldn't generate narration. Deterministic report still applies.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-mingle-border bg-mingle-bg/50 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
            AI briefing
          </p>
          <p className="mt-0.5 text-[11px] text-mingle-text-secondary">
            Rewrites existing evidence only — never invents facts.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={pending}
          className="rounded-full bg-mingle-lavender px-3 py-1.5 text-[11px] font-semibold text-mingle-text disabled:opacity-60"
        >
          {pending ? "Writing…" : narration ? "Refresh" : "Generate"}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[12px] text-mingle-pink">{error}</p>
      ) : null}

      {narration ? (
        <div className="mt-3 flex flex-col gap-2.5">
          <p className="text-[13px] leading-snug text-mingle-text">
            {narration.summary}
          </p>
          {narration.whyBullets.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {narration.whyBullets.map((line) => (
                <li
                  key={line}
                  className="text-[12px] leading-snug text-mingle-text-secondary"
                >
                  ✓ {line}
                </li>
              ))}
            </ul>
          ) : null}
          {narration.riskBullets.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {narration.riskBullets.map((line) => (
                <li
                  key={line}
                  className="text-[12px] leading-snug text-mingle-text-secondary"
                >
                  ⚠ {line}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-[12px] text-mingle-text-secondary">
            {narration.nextStepBlurb}
          </p>
          <p className="text-[10px] text-mingle-text-secondary">
            {narration.usedAi
              ? "Generated with Gemini from match evidence."
              : "Deterministic fallback (Gemini not configured)."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
