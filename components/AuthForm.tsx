"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { AuthVisualPanel } from "@/components/AuthVisualPanel";
import { createClient } from "@/lib/supabase/client";
import { destinationAfterAuth } from "@/lib/auth/destination";
import { authSchema, type AuthFormValues } from "@/lib/validation/auth";
import {
  COMPANY_WORK_EMAIL_MESSAGE,
  isWorkEmail,
} from "@/lib/auth/work-email";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { identifyUser, track } from "@/lib/analytics/track";
import type { UserType } from "@/lib/supabase/types";

const PATH_COPY: Record<
  UserType,
  { eyebrow: string; headline: string; sub: string }
> = {
  talent: {
    eyebrow: "Continuing as talent",
    headline: "Welcome to mingle",
    sub: "Get matched with roles that fit — free for talent.",
  },
  company: {
    eyebrow: "Continuing as a company",
    headline: "Welcome to mingle",
    sub: "See the few people worth talking to, with clear reasons.",
  },
};

const PATH_CONFIRM: Record<
  UserType,
  {
    segmentLabel: string;
    confirm: string;
    switchTo: UserType;
    switchLabel: string;
  }
> = {
  talent: {
    segmentLabel: "Talent",
    confirm: "Confirm Talent",
    switchTo: "company",
    switchLabel: "Switch to Company",
  },
  company: {
    segmentLabel: "Company",
    confirm: "Confirm Company",
    switchTo: "talent",
    switchLabel: "Switch to Talent",
  },
};

const SIGNIN_COPY = {
  eyebrow: "Welcome back",
  headline: "Sign in to mingle",
  sub: "Pick up where you left off.",
};

const SIGNUP_GENERIC = {
  eyebrow: "Get started — it’s free for talent",
  headline: "Welcome to mingle",
  sub: "No credit card needed. Choose how you’re joining.",
};

type AuthMode = "signup" | "signin";

export function AuthForm({
  path: initialPath,
  initialMode = "signin",
  initialError = null,
}: {
  path: UserType | null;
  initialMode?: AuthMode;
  initialError?: "work_email" | null;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<AuthMode>(initialMode);
  // Stay neutral until the user taps Talent or Company (or arrives with ?path=).
  const [path, setPath] = useState<UserType | null>(initialPath);
  const [serverError, setServerError] = useState<string | null>(
    initialError === "work_email" ? COMPANY_WORK_EMAIL_MESSAGE : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmingPath, setConfirmingPath] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AuthFormValues>({ resolver: zodResolver(authSchema) });

  const goAfterAuth = async (userId: string, resolvedPath: UserType) => {
    // destinationAfterAuth already reconciles the users row — avoid a second
    // ensureUserProfile round-trip that made sign-in feel stuck.
    let next: string;
    try {
      next = await destinationAfterAuth(
        supabase,
        userId,
        resolvedPath,
        getValues("email"),
      );
    } catch (profileError) {
      setServerError(
        profileError instanceof Error
          ? profileError.message
          : "Couldn't set up your profile. Try again.",
      );
      setIsSubmitting(false);
      return;
    }
    startTransition(() => {
      router.push(next);
      router.refresh();
    });
  };

  const createAccount = async (values: AuthFormValues, selectedPath: UserType) => {
    setServerError(null);

    if (selectedPath === "company" && !isWorkEmail(values.email)) {
      setServerError(COMPANY_WORK_EMAIL_MESSAGE);
      setConfirmingPath(false);
      return;
    }

    setIsSubmitting(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { user_type: selectedPath } },
    });

    if (signUpError) {
      setServerError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (!signUpData.session) {
      const existingAccount = (signUpData.user?.identities?.length ?? 0) === 0;
      if (existingAccount) {
        setServerError("That email already has an account. Sign in instead.");
        setConfirmingPath(false);
        setMode("signin");
        setIsSubmitting(false);
        return;
      }
      setAwaitingConfirmation(true);
      setConfirmingPath(false);
      setIsSubmitting(false);
      track(
        AnalyticsEvent.signup,
        { path: selectedPath, awaiting_confirmation: true },
        signUpData.user?.id,
      );
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setServerError("Couldn't create your account. Try again.");
      setIsSubmitting(false);
      return;
    }
    track(AnalyticsEvent.signup, { path: selectedPath }, userId);
    identifyUser(userId, { path: selectedPath });
    await goAfterAuth(userId, selectedPath);
  };

  const onSubmit = async (values: AuthFormValues) => {
    track(AnalyticsEvent.authSubmitClicked, { mode, path: path ?? "unknown" });
    setServerError(null);

    if (mode === "signin") {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error || !data.user) {
        setServerError(error?.message ?? "Couldn't sign in.");
        setIsSubmitting(false);
        return;
      }

      const { data: row } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", data.user.id)
        .maybeSingle();
      const metaType = data.user.user_metadata?.user_type;
      const resolvedPath: UserType =
        row?.user_type === "company" || row?.user_type === "talent"
          ? row.user_type
          : metaType === "company" || metaType === "talent"
            ? metaType
            : path ?? "talent";

      track(AnalyticsEvent.signIn, { path: resolvedPath }, data.user.id);
      identifyUser(data.user.id, { path: resolvedPath });
      await goAfterAuth(data.user.id, resolvedPath);
      return;
    }

    if (!path) {
      setServerError("Choose talent or company to create your account.");
      return;
    }

    if (path === "company" && !isWorkEmail(values.email)) {
      setServerError(COMPANY_WORK_EMAIL_MESSAGE);
      return;
    }

    // Gate signup behind an explicit path confirmation.
    setConfirmingPath(true);
    track(AnalyticsEvent.authPathConfirmShown, { path });
  };

  const copy =
    mode === "signin"
      ? SIGNIN_COPY
      : path
        ? PATH_COPY[path]
        : SIGNUP_GENERIC;

  const confirmCopy = path ? PATH_CONFIRM[path] : null;

  const continueWithGoogle = async () => {
    if (mode === "signup" && !path) {
      setServerError("Choose Talent or Company to continue.");
      return;
    }
    setServerError(null);
    setIsSubmitting(true);
    // Sign-in can omit path (resolved after session). Signup always has path here.
    const pathForRedirect = path ?? "talent";
    track(AnalyticsEvent.authGoogleClicked, {
      mode,
      path: pathForRedirect,
    });
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // path query is read by /auth/callback → ensureUserProfile (user_type).
        // Callback also rejects personal emails on the company track.
        redirectTo: `${origin}/auth/callback?path=${pathForRedirect}`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) {
      setServerError(error.message);
      setIsSubmitting(false);
    }
    // On success the browser redirects to Google — leave submitting true.
  };

  const formInner = awaitingConfirmation ? (
    <div className="flex w-full max-w-[400px] flex-col items-start text-left">
      <MingleLogo variant="mark" size={44} className="mb-8" />
      <h1 className="font-display text-[2rem] font-normal tracking-[-0.04em] text-mingle-text">
        Check your email
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-mingle-text-secondary">
        We sent a confirmation link to your inbox. Confirm your email, then come
        back and continue.
      </p>
    </div>
  ) : (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex w-full max-w-[400px] flex-col"
    >
      <MingleLogo variant="mark" size={44} priority className="mb-8" />
      <p className="text-sm font-normal text-mingle-text-secondary">{copy.eyebrow}</p>
      <h1 className="mt-2 font-display text-[2rem] font-normal leading-[1.15] tracking-[-0.04em] text-mingle-text sm:text-[2.25rem]">
        {copy.headline}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-mingle-text-secondary">
        {copy.sub}
      </p>

      {mode === "signup" ? (
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-mingle-border bg-mingle-white p-1">
          <button
            type="button"
            onClick={() => setPath("talent")}
            className={`rounded-full px-3 py-2.5 text-sm font-normal transition-colors ${
              path === "talent"
                ? "bg-mingle-accent-blue text-white"
                : "text-mingle-text-secondary hover:text-mingle-text"
            }`}
          >
            Talent
          </button>
          <button
            type="button"
            onClick={() => setPath("company")}
            className={`rounded-full px-3 py-2.5 text-sm font-normal transition-colors ${
              path === "company"
                ? "bg-mingle-accent-purple text-white"
                : "text-mingle-text-secondary hover:text-mingle-text"
            }`}
          >
            Company
          </button>
        </div>
      ) : null}

      <form
        method="post"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 flex flex-col gap-3.5"
      >
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            {...register("email")}
            className="w-full rounded-xl border border-mingle-border bg-mingle-white px-4 py-3.5 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-mingle-pink">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Password"
            {...register("password")}
            className="w-full rounded-xl border border-mingle-border bg-mingle-white px-4 py-3.5 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-mingle-pink">
              {errors.password.message}
            </p>
          )}
          {mode === "signin" ? (
            <>
              <button
                type="button"
                disabled={resetBusy}
                onClick={async () => {
                  setServerError(null);
                  setResetSent(false);
                  const email = getValues("email")?.trim();
                  if (!email) {
                    setServerError("Enter your email first.");
                    return;
                  }
                  setResetBusy(true);
                  track(AnalyticsEvent.passwordResetRequested, {});
                  const origin = window.location.origin;
                  const { error } = await supabase.auth.resetPasswordForEmail(
                    email,
                    {
                      redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
                    },
                  );
                  setResetBusy(false);
                  if (error) {
                    setServerError(error.message);
                    return;
                  }
                  setResetSent(true);
                }}
                className="mt-2 text-xs font-normal text-mingle-blue underline underline-offset-2 hover:text-mingle-text disabled:opacity-60"
              >
                {resetBusy ? "Sending…" : "Forgot password"}
              </button>
              {resetSent && (
                <p className="mt-1.5 text-xs text-mingle-text-secondary">
                  If that email is on mingle, we sent a reset link.
                </p>
              )}
            </>
          ) : null}
        </div>

        {serverError && !confirmingPath ? (
          <p className="text-sm text-mingle-pink">{serverError}</p>
        ) : null}

        {mode === "signup" && !path ? (
          <p className="text-sm text-mingle-pink" role="status">
            Choose Talent or Company to continue.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || (mode === "signup" && !path)}
          className="mt-1 rounded-full bg-mingle-accent-blue px-6 py-3.5 text-sm font-normal text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {isSubmitting
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Continue"
              : "Sign in"}
        </button>

        <div className="relative my-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-mingle-border" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-mingle-text-secondary">
            or
          </span>
          <div className="h-px flex-1 bg-mingle-border" />
        </div>

        <button
          type="button"
          disabled={isSubmitting || (mode === "signup" && !path)}
          onClick={() => void continueWithGoogle()}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-mingle-border bg-mingle-white px-6 py-3.5 text-sm font-normal text-mingle-text transition-colors hover:bg-mingle-lavender disabled:opacity-60"
        >
          <GoogleMark />
          Continue with Google
        </button>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-mingle-text-secondary">
        By continuing you agree to the{" "}
        <Link href="/legal/terms" className="text-mingle-blue underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="text-mingle-blue underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </motion.div>
  );

  const segmentBorder =
    path === "company" ? "border-[#a78bfa]" : "border-[#60a5fa]";
  const segmentButton =
    path === "company"
      ? "bg-mingle-accent-purple hover:opacity-95"
      : "bg-mingle-accent-blue hover:opacity-95";
  const segmentSoft =
    path === "company"
      ? "bg-[#faf8ff] text-[#6d28d9]"
      : "bg-[#f5f9ff] text-[#2563eb]";

  return (
    <div className="relative flex min-h-screen flex-1 bg-mingle-white">
      <section className="relative flex min-h-screen w-full flex-col lg:w-1/2">
        <div
          className={`flex flex-1 items-center justify-center px-6 py-12 sm:px-10 ${
            confirmingPath ? "pointer-events-none select-none blur-[1.5px]" : ""
          }`}
        >
          {formInner}
        </div>

        {!awaitingConfirmation && !confirmingPath ? (
          <div className="border-t border-mingle-border px-6 py-5 text-center text-sm text-mingle-text-secondary sm:px-10">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    track(AnalyticsEvent.authModeToggled, { mode: "signin" });
                    setMode("signin");
                    setConfirmingPath(false);
                  }}
                  className="font-medium text-mingle-blue underline underline-offset-2 hover:text-mingle-text"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    track(AnalyticsEvent.authModeToggled, { mode: "signup" });
                    setMode("signup");
                    // Keep segment unset until they tap Talent or Company.
                    setPath(null);
                  }}
                  className="font-medium text-mingle-blue underline underline-offset-2 hover:text-mingle-text"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>

      <AuthVisualPanel path={path} />

      {confirmingPath && path && confirmCopy ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1e1b4b]/35 px-4 backdrop-blur-[2px]">
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="path-confirm-title"
            aria-describedby="path-confirm-body"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`w-full max-w-[360px] rounded-[28px] border-2 ${segmentBorder} bg-[#fcfcff] p-6 shadow-[0_28px_80px_rgba(30,27,75,0.28)]`}
          >
            <div className="flex flex-col items-center text-center">
              <span
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${segmentSoft}`}
                aria-hidden
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3.6 21.2 19.4H2.8L12 3.6Z"
                    fill="currentColor"
                    fillOpacity="0.14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 9.2v5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="16.6" r="1.05" fill="currentColor" />
                </svg>
              </span>

              <h2
                id="path-confirm-title"
                className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-black"
              >
                Please make sure you selected the correct segment for
                registration.
              </h2>
              <p
                id="path-confirm-body"
                className="mt-3 text-sm leading-relaxed text-black/75"
              >
                You&apos;re about to join as{" "}
                <span className="font-semibold text-black">
                  {confirmCopy.segmentLabel}
                </span>
                . Switching later is harder — confirm now.
              </p>

              {serverError ? (
                <p className="mt-3 text-sm text-mingle-pink">{serverError}</p>
              ) : null}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  track(AnalyticsEvent.authPathConfirmed, { path });
                  void createAccount(getValues(), path);
                }}
                className={`mt-6 w-full rounded-full px-6 py-3.5 text-sm font-normal text-white transition-opacity disabled:opacity-60 ${segmentButton}`}
              >
                {isSubmitting ? "Creating account…" : confirmCopy.confirm}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const next = confirmCopy.switchTo;
                  track(AnalyticsEvent.authPathSwitched, {
                    from: path,
                    to: next,
                  });
                  setPath(next);
                  setServerError(null);
                }}
                className="mt-3 w-full rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-normal text-black transition-colors hover:bg-black/[0.03] disabled:opacity-60"
              >
                {confirmCopy.switchLabel}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setConfirmingPath(false);
                  setServerError(null);
                }}
                className="mt-4 text-sm font-normal text-black/55 underline underline-offset-2 hover:text-black disabled:opacity-60"
              >
                Go back
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l.1.1 6.2 5.2C36.9 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
