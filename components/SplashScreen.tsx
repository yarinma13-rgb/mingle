"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";

export type SplashVariant = "mobile" | "web";

/**
 * Brand entrance shown briefly before the Welcome screen. Mobile gets the
 * full, unhurried moment with a manual "Get Started" to skip ahead; web
 * gets a much shorter, subtler pass with no button so desktop doesn't
 * feel like it's loading.
 */
export function SplashScreen({
  variant,
  onContinue,
}: {
  variant: SplashVariant;
  onContinue?: () => void;
}) {
  const isMobile = variant === "mobile";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isMobile ? 0.35 : 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mingle-bg px-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: isMobile ? 0.8 : 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isMobile ? 0.6 : 0.3, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <MingleLogo
          variant="lockup"
          stacked
          size={isMobile ? 72 : 40}
          priority
        />
        <p
          className={`mt-6 text-center text-mingle-text-secondary ${
            isMobile ? "text-base" : "text-sm"
          }`}
        >
          Careers start with connection
        </p>
      </motion.div>

      {isMobile && onContinue && (
        <motion.button
          type="button"
          onClick={onContinue}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          whileTap={{ scale: 0.97 }}
          className="absolute bottom-14 left-5 right-5 rounded-full bg-gradient-to-r from-mingle-pink to-mingle-purple px-8 py-4 font-display text-base font-semibold text-mingle-white"
        >
          Get Started
        </motion.button>
      )}
    </motion.div>
  );
}
