/** monday-like motion tokens — calm, no overshoot / bounce. */
export const demoEase = [0.4, 0.0, 0.2, 1] as const;
export const demoEaseSoft = [0.33, 0.0, 0.2, 1] as const;
/** Longer cinematic ease for scene-to-scene crossfades. */
export const demoEaseCinematic = [0.45, 0.05, 0.2, 1] as const;

export const demoTransition = {
  duration: 0.55,
  ease: demoEase,
};

/** Opacity-first scene content — no blur (blur causes recording flicker). */
export const demoContentVariants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: demoEaseCinematic,
      when: "beforeChildren" as const,
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: 0,
    transition: {
      duration: 0.45,
      ease: demoEaseSoft,
    },
  },
};

export const demoItemVariants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: demoEase },
  },
};

export const demoChromeShellTransition = {
  duration: 0.5,
  ease: demoEaseCinematic,
};

export const demoCaptionVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: demoEase },
  },
  exit: {
    opacity: 0,
    y: 0,
    transition: { duration: 0.35, ease: demoEaseSoft },
  },
};

export const demoFullBleedVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.75, ease: demoEaseCinematic },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.55, ease: demoEaseSoft },
  },
};

/** Soft chrome content swap — opacity only (no vertical jump). */
export const demoSceneCrossfade = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.7, ease: demoEaseCinematic },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: demoEaseSoft },
  },
};

/** Camera zoom — longer, flatter ease for cinematic stability. */
export const demoCameraTransition = {
  duration: 1.1,
  ease: demoEaseCinematic,
};

/** Soft white veil between scenes (ms). */
export const DEMO_VEIL = {
  fadeMs: 520,
  holdMs: 180,
  peakOpacity: 0.38,
} as const;
