"use client";

import { motion } from "framer-motion";
import { CompanyScene } from "@/components/demo/scenes/CompanyScene";

/** Brief product entrance — same company dashboard surface as the live app. */
export function IntroduceScene({
  onOpenCandidate,
}: {
  onOpenCandidate?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <CompanyScene onOpenCandidate={onOpenCandidate} />
    </motion.div>
  );
}
