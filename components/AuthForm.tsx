"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { AuthVisualPanel } from "@/components/AuthVisualPanel";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { destinationAfterAuth } from "@/lib/auth/destination";
import { authSchema, type AuthFormValues } from "@/lib/validation/auth";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { identifyUser, track } from "@/lib/analytics/track";
import type { UserType } from "@/lib/supabase/types";

const PATH_COPY: Record<UserType, { eyebrow: string; headline: string; sub: string }> = {
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
}: {
  path: UserType | null;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [path, setPath] = useState<UserType | null>(initialPath);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AuthFormValues>({ resolver: zodResolver(authSchema) });

  const goAfterAuth = async (userId: string, resolvedPath: UserType) => {
    try {
      await ensureUserProfile(
        supabase,
        userId,
        getValues("email"),
        resolvedPath,
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
    const next = await destinationAfterAuth(
      supabase,
      userId,
      resolvedPath,
      getValues("email"),
    );
    router.push(next);
    router.refresh();
  };

  const onSubmit = async (values: AuthFormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    if (mode === "signin") {
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
      setIsSubmitting(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: values.email,
        password: values.password,
        options: { data: { user_type: path } },
      },
    );

    if (signUpError) {
      setServerError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (!signUpData.session) {
      const existingAccount = (signUpData.user?.identities?.length ?? 0) === 0;
      if (existingAccount) {
        setServerError("That email already has an account. Sign in instead.");
        setMode("signin");
        setIsSubmitting(false);
        return;
      }
      setAwaitingConfirmation(true);
      setIsSubmitting(false);
      track(
        AnalyticsEvent.signup,
        { path, awaiting_confirmation: true },
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
    track(AnalyticsEvent.signup, { path }, userId);
    identifyUser(userId, { path });
    await goAfterAuth(userId, path);
  };

  const copy =
    mode === "signin"
      ? SIGNIN_COPY
      : path
        ? PATH_COPY[path]
        : SIGNUP_GENERIC;

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

        {serverError && (
          <p className="text-sm text-mingle-pink">{serverError}</p>
        )}

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

  return (
    <div className="flex min-h-screen flex-1 bg-mingle-white">
      <section className="relative flex min-h-screen w-full flex-col lg:w-1/2">
        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          {formInner}
        </div>

        {!awaitingConfirmation ? (
          <div className="border-t border-mingle-border px-6 py-5 text-center text-sm text-mingle-text-secondary sm:px-10">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
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
                  onClick={() => setMode("signup")}
                  className="font-medium text-mingle-blue underline underline-offset-2 hover:text-mingle-text"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>

      <AuthVisualPanel />
    </div>
  );
}
