"use client";

import { motion } from "framer-motion";
import { demoContentVariants, demoItemVariants } from "@/lib/demo/motion";

/** Staggered entrance for product panels — monday-calm, not flashy. */
export function DemoStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={demoContentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

export function DemoStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={demoItemVariants}>
      {children}
    </motion.div>
  );
}
