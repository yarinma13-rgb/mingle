"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm({
  title = "Change password",
}: {
  title?: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage("Password updated.");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
        {title}
      </h2>
      <label className="sr-only" htmlFor="new-password">
        New password
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        placeholder="New password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-3.5 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
      />
      <label className="sr-only" htmlFor="confirm-password">
        Confirm password
      </label>
      <input
        id="confirm-password"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-3.5 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
      />
      {error && <p className="text-sm text-mingle-pink">{error}</p>}
      {message && (
        <p className="text-sm text-mingle-text-secondary">{message}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mingle-btn-primary mt-1 self-start text-xs disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
