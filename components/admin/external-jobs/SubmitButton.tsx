"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that shows it is working. Server actions here can take up to
 * a minute (a crawl), so without this a click looks like nothing happened.
 */
export function SubmitButton({
  children,
  className,
  pendingLabel = "Working…",
  name,
  value,
}: {
  children: React.ReactNode;
  className: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  // With several buttons in one form, only the clicked one says "Working…".
  const isThis = pending && (!name || data?.get(name) === value);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={isThis}
      className={`${className} ${pending ? "cursor-wait opacity-60" : ""}`.trim()}
    >
      {isThis ? pendingLabel : children}
    </button>
  );
}
