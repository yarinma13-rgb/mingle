"use client";

import { useState, useTransition } from "react";
import { reviewMatchAction } from "@/lib/admin/actions";

export function MatchReviewActions({
  roleId,
  candidateId,
}: {
  roleId: string;
  candidateId: string;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(action: "approved" | "rejected" | "flagged" | "note") {
    const data = new FormData();
    data.set("roleId", roleId);
    data.set("candidateId", candidateId);
    data.set("action", action);
    if (note.trim()) data.set("note", note.trim());
    start(async () => {
      setError(null);
      const result = await reviewMatchAction(data);
      if (!result.ok) setError(result.error);
      else if (action === "note") setNote("");
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">
        Review actions
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("approved")}
          className="mingle-btn-primary text-xs"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("rejected")}
          className="mingle-btn-secondary text-xs"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("flagged")}
          className="mingle-btn-secondary text-xs"
        >
          Flag
        </button>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[11px] font-semibold text-mingle-text-secondary">
          Internal note
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
          placeholder="Visible only in this audit log"
        />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => submit("note")}
        className="mingle-btn-secondary self-start text-xs"
      >
        Save note
      </button>
      {error ? <p className="text-sm text-mingle-warning">{error}</p> : null}
    </div>
  );
}
