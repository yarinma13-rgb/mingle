import type { Metadata } from "next";
import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";
import { previewTakedown } from "@/lib/external-jobs/takedown";
import { confirmTakedownAction } from "@/lib/external-jobs/takedown-action";

export const metadata: Metadata = {
  title: "Confirm job listing removal | mingle",
  robots: { index: false, follow: false },
};

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export default async function ConfirmRemovalPage({ searchParams }: PageProps<"/job-removal/confirm">) {
  const query = await searchParams;
  const id = one(query.id);
  const token = one(query.token);
  const preview = /^[0-9a-f-]{36}$/i.test(id) && token ? await previewTakedown(id, token) : null;
  const pending = preview?.status === "pending_verification";

  return (
    <main className="flex min-h-screen flex-1 justify-center px-4 py-12 sm:px-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="flex justify-center">
          <MingleLogo variant="mark" size={32} />
        </div>
        {!preview ? (
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl font-semibold text-mingle-text">This link is not valid</h1>
            <p className="text-sm text-mingle-text-secondary">
              It may have been mistyped. You can{" "}
              <Link href="/job-removal" className="underline underline-offset-2">submit a new request</Link>.
            </p>
          </div>
        ) : !pending ? (
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl font-semibold text-mingle-text">
              {preview.status === "completed" ? "Already removed" : "This request can’t be confirmed here"}
            </h1>
            <p className="text-sm text-mingle-text-secondary">
              {preview.status === "completed"
                ? "This removal request was already completed."
                : "Our team is handling this request. Email support@mingle.careers if you need help."}
            </p>
          </div>
        ) : (
          <form action={confirmTakedownAction} className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-white p-5">
            <h1 className="font-display text-2xl font-semibold text-mingle-text">Confirm removal</h1>
            <p className="text-sm leading-relaxed text-mingle-text">
              {preview.scope === "job" ? (
                <>
                  Remove the listing <strong dir="auto">{preview.jobTitle ?? "(already unavailable)"}</strong> from mingle.
                </>
              ) : (
                <>
                  Remove all listings from{" "}
                  <strong>{preview.sourceNames.length ? [...new Set(preview.sourceNames)].join(", ") : preview.companyName}</strong>{" "}
                  and stop collecting them.
                </>
              )}{" "}
              This takes effect immediately.
            </p>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="mingle-btn-primary self-start text-sm">
              Confirm removal
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
