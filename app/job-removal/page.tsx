import type { Metadata } from "next";
import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";
import { submitTakedownAction } from "@/lib/external-jobs/takedown-action";

export const metadata: Metadata = {
  title: "Request removal of a job listing | mingle",
  description:
    "Employers can ask mingle to remove external job listings sourced from their careers site.",
};

const inputClass =
  "w-full rounded-xl border border-mingle-border bg-mingle-white px-3 py-2.5 text-base text-mingle-text sm:text-sm";

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  check_email: {
    title: "Check your inbox",
    body: "We sent a confirmation link to your work email. The listing is removed as soon as you click it.",
  },
  received: {
    title: "Request received",
    body: "Our team will verify the request and remove the listing. We usually act within one business day.",
  },
  removed: {
    title: "Removed",
    body: "The listing has been removed from mingle. For a company-wide request we have also stopped collecting your jobs.",
  },
  invalid: {
    title: "This link is not valid",
    body: "The confirmation link is invalid or has already been used. Submit a new request below if needed.",
  },
  error: {
    title: "Something went wrong",
    body: "Please check the form and try again, or email support@mingle.careers.",
  },
};

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export default async function JobRemovalPage({ searchParams }: PageProps<"/job-removal">) {
  const query = await searchParams;
  const status = STATUS_COPY[one(query.status)];
  const jobId = /^[0-9a-f-]{36}$/i.test(one(query.jobId)) ? one(query.jobId) : "";

  return (
    <main className="flex min-h-screen flex-1 justify-center px-4 py-12 sm:px-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="flex justify-center">
          <MingleLogo variant="mark" size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold text-mingle-text">Remove a job listing</h1>
          <p className="text-sm leading-relaxed text-mingle-text-secondary">
            mingle shows some jobs from companies’ official careers sites as “External Opportunities”, always
            linking back to the company to apply. If you represent the employer and want a listing (or all of
            your listings) removed, tell us here. Requests from an email on your company’s domain are confirmed by
            email and take effect immediately.
          </p>
        </div>

        {status ? (
          <div role="status" className="rounded-2xl border border-mingle-border bg-mingle-lavender/60 p-4">
            <p className="font-semibold text-mingle-text">{status.title}</p>
            <p className="mt-1 text-sm text-mingle-text-secondary">{status.body}</p>
            {one(query.count) ? (
              <p className="mt-1 text-sm text-mingle-text-secondary">{one(query.count)} listing(s) removed.</p>
            ) : null}
          </div>
        ) : null}

        <form action={submitTakedownAction} className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-white p-5">
          <label className="flex flex-col gap-1 text-sm text-mingle-text">
            Company name
            <input name="companyName" required minLength={2} maxLength={120} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-mingle-text">
            Your name
            <input name="requesterName" maxLength={120} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-mingle-text">
            Work email
            <input name="requesterEmail" type="email" required className={inputClass} />
          </label>
          {jobId ? <input type="hidden" name="jobId" value={jobId} /> : null}
          <fieldset className="flex flex-col gap-2 text-sm text-mingle-text">
            <legend className="mb-1">What should we remove?</legend>
            {jobId ? (
              <label className="flex items-center gap-2">
                <input type="radio" name="scope" value="job" defaultChecked /> This listing only
              </label>
            ) : null}
            <label className="flex items-center gap-2">
              <input type="radio" name="scope" value="company" defaultChecked={!jobId} /> All listings for our
              company, and stop collecting them
            </label>
          </fieldset>
          <label className="flex flex-col gap-1 text-sm text-mingle-text">
            Anything else we should know? (optional)
            <textarea name="reason" rows={3} maxLength={2000} className={inputClass} />
          </label>
          <button type="submit" className="mingle-btn-primary self-start text-sm">
            Send request
          </button>
        </form>
        <p className="text-center text-xs text-mingle-text-secondary">
          <Link href="/legal/terms" className="underline underline-offset-2">Terms</Link> ·{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">Privacy</Link>
        </p>
      </div>
    </main>
  );
}
