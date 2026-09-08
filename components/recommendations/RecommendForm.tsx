"use client";

import { useState } from "react";
import { RecommendationStars } from "@/components/recommendations/RecommendationStars";
import { submitRecommendation } from "@/lib/recommendations/actions";

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
      className="flex flex-col gap-4"
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
      <div>
        <p className="mb-2 text-sm font-medium text-mingle-text" dir="rtl">
          דירוג
        </p>
        <RecommendationStars rating={rating} interactive onChange={setRating} />
      </div>
      <label className="block text-sm font-medium text-mingle-text" dir="rtl">
        ההמלצה
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
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
