"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring/sentry";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mingle-bg px-6 text-center">
      <p className="font-display text-xl font-bold text-mingle-white">
        Something went wrong
      </p>
      <p className="mt-2 max-w-sm text-sm text-mingle-text-secondary">
        Try again in a moment. If it keeps happening, come back later.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-full bg-mingle-cta px-8 py-3 font-display text-sm font-semibold text-mingle-white"
      >
        Try again
      </button>
    </div>
  );
}
