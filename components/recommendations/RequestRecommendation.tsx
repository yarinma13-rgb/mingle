"use client";

import { useState } from "react";
import { requestRecommendation } from "@/lib/recommendations/actions";
import { useToast } from "@/components/toast/ToastProvider";

export function RequestRecommendation() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [method, setMethod] = useState<"email" | "whatsapp">("email");
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
    const result = await requestRecommendation({
      recommenderName: name,
      recommenderContact: contact,
      deliveryMethod: method,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.deliveryMethod === "whatsapp") {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      toast("WhatsApp is open with the message ready to send.");
    } else {
      toast("Request sent by email.");
    }
    setName("");
    setContact("");
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full bg-mingle-surface px-8 py-3.5 text-center font-display text-sm font-semibold text-mingle-text transition-colors hover:bg-mingle-surface/70"
      >
        Request a recommendation
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-labelledby="request-recommendation-title"
            className="w-full max-w-sm rounded-2xl border border-mingle-border bg-mingle-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="request-recommendation-title"
              className="font-display text-lg font-bold text-mingle-text"
            >
              Request a recommendation
            </h2>
            <p className="mt-2 text-sm text-mingle-text-secondary">
              Ask someone who has worked with you. They will sign in with LinkedIn before they write.
            </p>

            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Their name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              />
            </label>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-mingle-text">Send by</legend>
              <div className="mt-2 flex gap-2">
                {(
                  [
                    ["email", "Email"],
                    ["whatsapp", "WhatsApp"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      method === value
                        ? "bg-mingle-cta text-white"
                        : "bg-mingle-bg text-mingle-text-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block text-sm font-medium text-mingle-text">
              {method === "email" ? "Email" : "Phone"}
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                inputMode={method === "email" ? "email" : "tel"}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              />
            </label>
            {method === "whatsapp" ? (
              <p className="mt-2 text-xs text-mingle-text-secondary">
                mingle will open WhatsApp with the link ready. You send it from your own chat.
              </p>
            ) : null}

            {error ? <p className="mt-3 text-sm text-mingle-pink">{error}</p> : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
                {busy
                  ? "Saving…"
                  : method === "whatsapp"
                    ? "Open WhatsApp"
                    : "Send email"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
