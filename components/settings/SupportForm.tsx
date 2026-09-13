"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { submitSupportReport } from "@/lib/support/actions";

const CATEGORIES = [
  { value: "something_broken", label: "Something is broken" },
  { value: "account_access", label: "Account / sign-in" },
  { value: "matching", label: "Matching / roles" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Something else" },
] as const;

export function SupportForm({ userEmail }: { userEmail: string }) {
  const [category, setCategory] = useState<string>("something_broken");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitSupportReport({
        category,
        subject,
        message,
        pageUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
      setSubject("");
      setMessage("");
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
        <p className="text-xs font-semibold uppercase tracking-wide text-mingle-blue">
          Report received
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-mingle-text">
          Thanks — we got it.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-mingle-text-secondary">
          We&apos;ll review your note and follow up at{" "}
          <span className="font-medium text-mingle-text">{userEmail}</span>{" "}
          if we need more detail.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mingle-btn-secondary text-xs"
          >
            Send another report
          </button>
          <Link href="/settings" className="mingle-btn-primary text-xs">
            Back to settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle"
      noValidate
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">
        Report a problem
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-mingle-text">
        Tell us what went wrong
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-mingle-text-secondary">
        Signed in as {userEmail}. We use this only to help fix the issue.
      </p>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-xs font-semibold text-mingle-text">
          Category
        </span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-3 py-2.5 text-sm text-mingle-text focus:border-mingle-blue focus:outline-none"
        >
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-mingle-text">
          Subject <span className="font-normal text-mingle-text-secondary">(optional)</span>
        </span>
        <input
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={120}
          placeholder="Short summary"
          className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-3 py-2.5 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-mingle-text">
          What happened?
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={6}
          maxLength={4000}
          placeholder="What were you trying to do, and what went wrong?"
          className="w-full resize-y rounded-[10px] border border-mingle-border bg-mingle-white px-3 py-2.5 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-mingle-pink" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mingle-btn-primary mt-5 w-full sm:w-auto"
      >
        {pending ? "Sending…" : "Send to support"}
      </button>
    </form>
  );
}
