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

export function AuthForm({ path }: { path: UserType }) {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({ resolver: zodResolver(authSchema) });

  const onSubmit = async (values: AuthFormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    // Try sign up first; if the account already exists, fall back to
    // signing in — a single "Continue" instead of forcing the user to
    // pick sign-up vs. log-in up front.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: values.email,
        password: values.password,
        options: { data: { user_type: path } },
      },
    );

    const signInExisting = async (): Promise<string | null> => {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
      if (signInError) {
        setServerError(signInError.message);
        setIsSubmitting(false);
        return null;
      }
      const signedInId = signInData.user.id;
      track(AnalyticsEvent.signIn, { path }, signedInId);
      identifyUser(signedInId, { path });
      return signedInId;
    };

    let userId: string | undefined = signUpData?.user?.id;

    if (signUpError) {
      const alreadyExists = /already registered|already exists/i.test(
        signUpError.message,
      );
      if (!alreadyExists) {
        setServerError(signUpError.message);
        setIsSubmitting(false);
        return;
      }

      const signedInId = await signInExisting();
      if (!signedInId) return;
      userId = signedInId;
    } else if (!signUpData.session) {
      // Anti-enumeration: signUp on an existing confirmed email can
      // return success with no session and an empty identities array.
      // That is not a new user waiting to confirm — sign them in.
      const existingAccount =
        (signUpData.user?.identities?.length ?? 0) === 0;
      if (existingAccount) {
        const signedInId = await signInExisting();
        if (!signedInId) return;
        userId = signedInId;
      } else {
        setAwaitingConfirmation(true);
        setIsSubmitting(false);
        track(
          AnalyticsEvent.signup,
          { path, awaiting_confirmation: true },
          userId,
        );
        return;
      }
    } else if (userId) {
      track(AnalyticsEvent.signup, { path }, userId);
      identifyUser(userId, { path });
    }

    // Belt and suspenders: the migration's trigger is meant to create this
    // row, but don't let onboarding depend on a trigger having fired.
    if (userId) {
      try {
        await ensureUserProfile(supabase, userId, values.email, path);
      } catch (profileError) {
        setServerError(
          profileError instanceof Error
            ? profileError.message
            : "Couldn't set up your profile. Try again.",
        );
        setIsSubmitting(false);
        return;
      }
    }

    router.push(`/onboarding/${path}`);
    router.refresh();
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
          <MingleLogo variant="mark" size={40} className="mb-8" />
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
          <MingleLogo variant="mark" size={40} priority className="mb-8" />
          <span className="mingle-gradient-text font-display text-xs font-semibold uppercase tracking-[0.16em]">
            {copy.eyebrow}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-mingle-text">
            {copy.headline}
          </h1>
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
              autoComplete="current-password"
              placeholder="Password"
              {...register("password")}
              className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-3.5 text-sm text-mingle-text placeholder:text-mingle-muted focus:border-mingle-blue focus:outline-none"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-mingle-pink">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-mingle-pink">{serverError}</p>
          )}

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mingle-btn-primary mt-2 disabled:opacity-60"
          >
            {isSubmitting ? "Continuing…" : "Continue"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-mingle-text-secondary">
          New here or already have an account. Continue either way.
        </p>
        <p className="mt-4 text-center text-xs text-mingle-text-secondary">
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
