"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mingle.pilotTips.dismissed.v1";

const TIPS = [
  "Complete your profile — Discover only surfaces people with enough signal.",
  "On Discover, Skip is pink X and Interested is blue check.",
  "Companies: open Board to drag relationships through stages.",
  "Turn on push in Settings once VAPID keys are live.",
] as const;

export function PilotTips() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const tip = TIPS[index] ?? TIPS[0];
  const last = index >= TIPS.length - 1;

  return (
    <aside className="rounded-2xl border border-mingle-blue/25 bg-mingle-lavender/70 px-4 py-3 shadow-mingle">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-blue">
            Pilot tip {index + 1}/{TIPS.length}
          </p>
          <p className="mt-1 text-sm leading-snug text-mingle-text">{tip}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss tips"
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setOpen(false);
          }}
          className="shrink-0 text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        {!last ? (
          <button
            type="button"
            onClick={() => setIndex((value) => value + 1)}
            className="rounded-full bg-mingle-cta px-3 py-1.5 font-display text-xs font-semibold text-white"
          >
            Next tip
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              try {
                window.localStorage.setItem(STORAGE_KEY, "1");
              } catch {
                /* ignore */
              }
              setOpen(false);
            }}
            className="rounded-full bg-mingle-cta px-3 py-1.5 font-display text-xs font-semibold text-white"
          >
            Got it
          </button>
        )}
      </div>
    </aside>
  );
}
