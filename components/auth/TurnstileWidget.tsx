"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Public Cloudflare Turnstile site key. Without it the widget is not rendered at all. */
export function turnstileSiteKey(): string | undefined {
  const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return value ? value : undefined;
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type Props = {
  onToken: (token: string | null) => void;
  /** Called if the challenge can't run (blocked script, error), so the form isn't locked forever. */
  onUnavailable: () => void;
  /** Bump to request a fresh token: Turnstile tokens are single-use. */
  resetKey: number;
};

export function TurnstileWidget({ onToken, onUnavailable, resetKey }: Props) {
  const siteKey = turnstileSiteKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onToken, onUnavailable });

  useEffect(() => {
    callbacksRef.current = { onToken, onUnavailable };
  }, [onToken, onUnavailable]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          callback: (token: string) => callbacksRef.current.onToken(token),
          "expired-callback": () => callbacksRef.current.onToken(null),
          "error-callback": () => callbacksRef.current.onUnavailable(),
        });
      })
      .catch(() => callbacksRef.current.onUnavailable());
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey === 0 || !widgetIdRef.current || !window.turnstile) return;
    callbacksRef.current.onToken(null);
    window.turnstile.reset(widgetIdRef.current);
  }, [resetKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="flex justify-center" />;
}
