/** monday-like motion tokens — calm, no overshoot / bounce. */
export const demoEase = [0.4, 0.0, 0.2, 1] as const;
export const demoEaseSoft = [0.33, 0.0, 0.2, 1] as const;

export const demoTransition = {
  duration: 0.5,
  ease: demoEase,
};

/** Opacity-first scene content — no blur (blur causes recording flicker). */
export const demoContentVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: demoEase,
      when: "beforeChildren" as const,
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.28,
      ease: demoEaseSoft,
    },
  },
};

export const demoItemVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: demoEase },
  },
};

export const demoChromeShellTransition = {
  duration: 0.4,
  ease: demoEase,
};

export const demoCaptionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: demoEase },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.22, ease: demoEaseSoft },
  },
};

export const demoFullBleedVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.55, ease: demoEase },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: demoEaseSoft },
  },
};

/** Camera zoom — longer, flatter ease for cinematic stability. */
export const demoCameraTransition = {
  duration: 0.95,
  ease: demoEase,
};
