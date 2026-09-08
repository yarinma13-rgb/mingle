"use client";

import { useState } from "react";
import { inviteTeammateAction } from "@/lib/team/actions";
import { TEAM_ROLE_OPTIONS } from "@/lib/team/persistence";
import type { CompanyMemberRole } from "@/lib/supabase/types";
import { useToast } from "@/components/toast/ToastProvider";

export function InviteTeammateButton({ onInvited }: { onInvited: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyMemberRole>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await inviteTeammateAction({ name, email, role });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Invite sent.");
    setName("");
    setEmail("");
    setRole("member");
    close();
    onInvited();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-mingle-cta px-5 py-2.5 font-display text-sm font-semibold text-white"
      >
        Invite teammate
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-labelledby="invite-teammate-title"
            className="w-full max-w-sm rounded-2xl border border-mingle-border bg-mingle-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="invite-teammate-title"
              className="font-display text-lg font-bold text-mingle-text"
            >
              Invite teammate
            </h2>
            <p className="mt-2 text-sm text-mingle-text-secondary">
              They join this workspace. They do not create a second company profile.
            </p>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                inputMode="email"
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Role
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as CompanyMemberRole)
                }
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              >
                {TEAM_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {error ? <p className="mt-3 text-sm text-mingle-pink">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-full bg-mingle-bg px-5 py-2.5 font-display text-sm font-semibold text-mingle-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="rounded-full bg-mingle-cta px-5 py-2.5 font-display text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
