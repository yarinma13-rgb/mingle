"use client";

import { useState } from "react";
import { RecommendationStars } from "@/components/recommendations/RecommendationStars";
import { submitRecommendation } from "@/lib/recommendations/actions";

const RATING_WORD: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

export function RecommendForm({
  token,
  linkedinName,
}: {
  token: string;
  linkedinName: string;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-sm text-mingle-text-secondary" dir="rtl">
        תודה. ההמלצה נוספה לפרופיל.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy || rating < 1) return;
        setBusy(true);
        setError(null);
        void submitRecommendation({ token, rating, body }).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setDone(true);
        });
      }}
    >
      <div>
        <p className="text-sm font-medium text-mingle-text">{linkedinName}</p>
        <p className="text-xs text-mingle-text-secondary">מאומת דרך LinkedIn</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-mingle-border bg-mingle-bg px-4 py-5">
        <p className="text-sm font-medium text-mingle-text" dir="rtl">
          דירוג
        </p>
        <div
          className="flex items-center justify-center gap-2"
          role="radiogroup"
          aria-label="Rating 1 to 5"
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = rating === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${value}`}
                onClick={() => setRating(value)}
                className={`flex h-11 w-11 items-center justify-center rounded-full font-display text-base font-bold transition-colors ${
                  selected
                    ? "bg-mingle-cta text-white shadow-mingle"
                    : "border border-mingle-border bg-mingle-white text-mingle-text hover:border-mingle-blue/50"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <RecommendationStars
          rating={rating}
          interactive
          size={34}
          onChange={setRating}
        />
        <p
          className={`min-h-[1.25rem] font-display text-sm font-semibold ${
            rating > 0 ? "text-mingle-text" : "text-transparent"
          }`}
          aria-live="polite"
        >
          {rating > 0 ? RATING_WORD[rating] : "Excellent"}
        </p>
      </div>

      <label className="block text-sm font-medium text-mingle-text" dir="rtl">
        ההמלצה
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          maxLength={2000}
          className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-start text-sm text-mingle-text outline-none focus:border-mingle-pink"
        />
      </label>
      {error ? <p className="text-sm text-mingle-pink">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || rating < 1 || !body.trim()}
        className="rounded-full bg-mingle-cta px-8 py-3.5 font-display text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "שולח…" : "שלחו המלצה"}
      </button>
    </form>
  );
}
