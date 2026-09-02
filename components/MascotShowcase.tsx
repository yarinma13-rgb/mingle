"use client";

import { useState } from "react";
// Mascot temporarily removed from this showcase page — see
// components/MascotMagnet.tsx, component and pose assets are kept.
import type { MascotState } from "@/components/MascotMagnet";
import { TalentGlyph, CompanyGlyph } from "@/components/PathGlyph";

function MascotPlaceholder({
  state,
  size,
}: {
  state: MascotState;
  size: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-dashed border-mingle-border text-center text-[10px] text-mingle-text-secondary"
      style={{ width: size, height: size }}
    >
      {state}
    </div>
  );
}

const STATES: MascotState[] = ["dormant", "charging", "mutual", "active"];

const SCORE_PRESETS = [15, 45, 75, 95];

function scoreToMascot(score: number): { state: MascotState; intensity: number } {
  if (score < 40) return { state: "dormant", intensity: score };
  return { state: "charging", intensity: score };
}

export function MascotShowcase() {
  const [score, setScore] = useState(45);
  const mascotFromScore = scoreToMascot(score);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-16 sm:px-10">
      <section className="flex flex-col items-center gap-8 text-center">
        <h1 className="font-display text-2xl font-bold text-mingle-white">
          Mascot magnet — all charge states
        </h1>
        <div className="flex flex-wrap items-start justify-center gap-10">
          {STATES.map((state) => (
            <MascotPlaceholder key={state} state={state} size={72} />
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 text-center">
        <h2 className="font-display text-lg font-semibold text-mingle-white">
          Charging responds to match score
        </h2>
        <MascotPlaceholder state={mascotFromScore.state} size={88} />
        <div className="flex items-center gap-2">
          {SCORE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setScore(preset)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                score === preset
                  ? "bg-mingle-purple text-mingle-white"
                  : "bg-mingle-surface text-mingle-text-secondary hover:text-mingle-white"
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="text-center">
          <h2 className="font-display text-lg font-semibold text-mingle-white">
            Preview — discovery match card
          </h2>
          <p className="mt-1 text-xs text-mingle-text-secondary">
            The real discovery screen is built in a later phase. This shows how
            the mascot sits inside a match card once it exists.
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-sm items-center gap-4 rounded-2xl bg-mingle-surface p-5">
          <TalentGlyph className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-mingle-white">
              Yarin Cohen
            </p>
            <p className="text-xs text-mingle-text-secondary">
              Product manager looking for growth and meaningful work
            </p>
          </div>
          <MascotPlaceholder state={mascotFromScore.state} size={44} />
        </div>

        <div className="mx-auto flex w-full max-w-sm items-center gap-4 rounded-2xl bg-mingle-surface p-5">
          <CompanyGlyph className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-mingle-white">
              Nova Labs
            </p>
            <p className="text-xs text-mingle-text-secondary">
              Technology scale up hiring for product and engineering
            </p>
          </div>
          <MascotPlaceholder state={mascotFromScore.state} size={44} />
        </div>
      </section>

      <section className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h2 className="font-display text-lg font-semibold text-mingle-white">
            Preview — complementing the MINGLE moment
          </h2>
          <p className="mt-1 text-xs text-mingle-text-secondary">
            The full celebration (M mark, confetti, haptics) is built in a
            later phase. The mascot sits underneath as a quiet complement,
            reaching full charge, never competing with the main moment.
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl bg-mingle-bg p-8">
          <span className="mingle-gradient-text font-display text-2xl font-bold">
            It&rsquo;s a mingle
          </span>
          <p className="text-center text-xs text-mingle-text-secondary">
            You both want to get to know each other
          </p>
          <MascotPlaceholder state="mutual" size={56} />
          <button
            type="button"
            className="rounded-full bg-mingle-cta px-6 py-2.5 font-display text-xs font-semibold text-mingle-white"
          >
            Start conversation
          </button>
        </div>
      </section>
    </div>
  );
}
