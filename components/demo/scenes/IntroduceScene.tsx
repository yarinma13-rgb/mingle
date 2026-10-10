"use client";

import { motion } from "framer-motion";
import { CompanyScene } from "@/components/demo/scenes/CompanyScene";
import { demoEase } from "@/lib/demo/motion";

/** Brief product entrance — same company dashboard surface as the live app. */
export function IntroduceScene({
  onOpenCandidate,
}: {
  onOpenCandidate?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: demoEase }}
    >
      <CompanyScene onOpenCandidate={onOpenCandidate} />
    </motion.div>
  );
}
