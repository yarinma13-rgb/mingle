/** monday-like motion tokens — calm ease, no bounce. */
export const demoEase = [0.22, 1, 0.36, 1] as const;
export const demoEaseSoft = [0.33, 1, 0.68, 1] as const;

export const demoTransition = {
  duration: 0.55,
  ease: demoEase,
};

export const demoContentVariants = {
  initial: {
    opacity: 0,
    y: 18,
    filter: "blur(6px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease: demoEase,
      when: "beforeChildren" as const,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(4px)",
    transition: {
      duration: 0.32,
      ease: demoEaseSoft,
    },
  },
};

export const demoItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: demoEase },
  },
};

export const demoChromeShellTransition = {
  duration: 0.45,
  ease: demoEase,
};

export const demoCaptionVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: demoEase },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    filter: "blur(6px)",
    transition: { duration: 0.28, ease: demoEaseSoft },
  },
};

export const demoFullBleedVariants = {
  initial: { opacity: 0, scale: 0.985 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: demoEase },
  },
  exit: {
    opacity: 0,
    scale: 1.01,
    transition: { duration: 0.35, ease: demoEaseSoft },
  },
};
