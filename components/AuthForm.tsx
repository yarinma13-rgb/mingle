"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { destinationAfterAuth } from "@/lib/auth/destination";
import { authSchema, type AuthFormValues } from "@/lib/validation/auth";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { identifyUser, track } from "@/lib/analytics/track";
import type { UserType } from "@/lib/supabase/types";

const PATH_COPY: Record<UserType, { eyebrow: string; headline: string }> = {
  talent: {
    eyebrow: "Continuing as talent",
    headline: "Find your next opportunity",
  },
  company: {
    eyebrow: "Continuing as a company",
    headline: "Find your next great hire",
  },
};

type AuthMode = "signup" | "signin";

export function AuthForm({ path }: { path: UserType }) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<AuthMode>("signin");
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

  const goAfterAuth = async (userId: string) => {
    try {
      await ensureUserProfile(supabase, userId, getValues("email"), path);
    } catch (profileError) {
      setServerError(
        profileError instanceof Error
          ? profileError.message
          : "Couldn't set up your profile. Try again.",
      );
      setIsSubmitting(false);
      return;
    }
    const next = await destinationAfterAuth(supabase, userId, path);
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
      track(AnalyticsEvent.signIn, { path }, data.user.id);
      identifyUser(data.user.id, { path });
      await goAfterAuth(data.user.id);
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
    await goAfterAuth(userId);
  };

  const copy = PATH_COPY[path];

  if (awaitingConfirmation) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16 text-center sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex w-full max-w-sm flex-col items-center"
        >
          <MingleLogo variant="mark" size={50} className="mb-8" />
          <h1 className="font-display text-2xl font-bold text-mingle-text">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-mingle-text-secondary">
            We sent a confirmation link to your inbox. Confirm your email,
            then come back and continue.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={50} priority className="mb-8" />
          <span className="mingle-gradient-text font-display text-xs font-semibold uppercase tracking-[0.16em]">
            {copy.eyebrow}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-mingle-text">
            {copy.headline}
          </h1>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-mingle-lavender p-1">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              mode === "signup"
                ? "bg-mingle-accent-purple text-white"
                : "text-mingle-text-secondary"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              mode === "signin"
                ? "bg-mingle-accent-blue text-white"
                : "text-mingle-text-secondary"
            }`}
          >
            Sign In
          </button>
        </div>

        <form
          method="post"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
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
              className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-3.5 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-mingle-pink">
                {errors.email.message}
              </p>
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
              className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-3.5 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
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
                  className="mt-2 text-xs font-medium text-mingle-text-secondary underline underline-offset-2 hover:text-mingle-text disabled:opacity-60"
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

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`mt-2 rounded-full px-6 py-3 font-display text-base font-semibold text-white disabled:opacity-60 ${
              mode === "signup"
                ? "bg-mingle-accent-purple"
                : "bg-mingle-accent-blue"
            }`}
          >
            {isSubmitting
              ? mode === "signup"
                ? "Creating account…"
                : "Signing in…"
              : mode === "signup"
                ? "Sign Up"
                : "Sign In"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-mingle-text-secondary">
          By continuing you agree to the{" "}
          <Link href="/legal/terms" className="text-mingle-text underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-mingle-text underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
}
