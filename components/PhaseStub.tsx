"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";

export function PhaseStub({
  headline,
  message,
  backHref = "/",
  backLabel = "Back",
}: {
  headline: string;
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center"
      >
        <MingleLogo variant="mark" size={48} className="mb-8" />

        <span className="mingle-gradient-text font-display text-sm font-semibold uppercase tracking-[0.2em]">
          Development-only checkpoint
        </span>

        <h1 className="mt-4 font-display text-3xl font-bold text-mingle-white">
          {headline}
        </h1>

        <p className="mt-4 text-base text-mingle-text-secondary">{message}</p>

        <Link
          href={backHref}
          className="mt-10 rounded-full bg-mingle-surface px-6 py-3 font-display text-sm font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70"
        >
          {backLabel}
        </Link>
      </motion.div>
    </main>
  );
}
