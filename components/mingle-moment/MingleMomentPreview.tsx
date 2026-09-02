"use client";

import { useState } from "react";
import { MingleMomentOverlay } from "@/components/mingle-moment/MingleMomentOverlay";

export function MingleMomentPreview() {
  const [open, setOpen] = useState(true);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-mingle-bg px-6">
      {open ? (
        <MingleMomentOverlay
          matchName="Yarin Cohen"
          matchUserId=""
          onClose={() => setOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-mingle-cta px-8 py-3.5 font-display text-sm font-semibold text-white"
        >
          Play mingle moment
        </button>
      )}
    </main>
  );
}
