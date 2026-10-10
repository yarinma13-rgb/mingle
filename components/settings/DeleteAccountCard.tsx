"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestAccountDeletion } from "@/lib/account/deletion";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

export function DeleteAccountCard() {
  const { t } = useAppLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not signed in.");
        setBusy(false);
        return;
      }
      await requestAccountDeletion(supabase, user.id);
      await supabase.auth.signOut();
      router.replace("/auth?mode=signin&deleted=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't schedule deletion.");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-mingle-error/30 bg-mingle-white p-5 shadow-mingle">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-mingle-error">
          {t.settings.danger}
        </h2>
        <p className="mt-2 text-sm font-semibold text-mingle-text">
          {t.settings.deleteAccount}
        </p>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          {t.settings.deleteAccountBody}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full border border-mingle-error/40 bg-mingle-error/10 px-4 py-2 text-xs font-semibold text-mingle-error transition-colors hover:bg-mingle-error/15"
        >
          {t.settings.deleteAccountCta}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-xl">
            <h3
              id="delete-account-title"
              className="font-display text-lg font-semibold text-mingle-text"
            >
              {t.settings.deleteTitle}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mingle-text-secondary">
              {t.settings.deleteWarn}
            </p>
            {error ? (
              <p className="mt-3 text-sm text-mingle-error">{error}</p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-full border border-mingle-border bg-mingle-white px-4 py-2.5 text-sm font-semibold text-mingle-text"
              >
                {t.settings.deleteCancel}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="rounded-full bg-mingle-error px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t.settings.deleteWorking : t.settings.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
