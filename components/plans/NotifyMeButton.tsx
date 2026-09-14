"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mingle.plans.notify";

export function NotifyMeButton() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      setDone(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const onClick = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDone(true);
  };

  if (done) {
    return (
      <p className="mt-4 text-sm font-medium text-mingle-success">
        You&apos;re on the list — we&apos;ll notify you when plans launch.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="mingle-btn-primary mt-6 inline-block text-xs"
    >
      Notify me
    </button>
  );
}
