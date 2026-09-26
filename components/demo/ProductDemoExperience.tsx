"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DemoChrome } from "@/components/demo/DemoChrome";
import { DemoFocusHighlight } from "@/components/demo/DemoFocusHighlight";
import { DemoGuidedCursor } from "@/components/demo/DemoGuidedCursor";
import { OpeningScene } from "@/components/demo/scenes/OpeningScene";
import { ProblemScene } from "@/components/demo/scenes/ProblemScene";
import { RoleScene } from "@/components/demo/scenes/RoleScene";
import { ProfileScene } from "@/components/demo/scenes/ProfileScene";
import { MatchScene } from "@/components/demo/scenes/MatchScene";
import { WhyMatchScene } from "@/components/demo/scenes/WhyMatchScene";
import { ConversationScene } from "@/components/demo/scenes/ConversationScene";
import { IdeaScene } from "@/components/demo/scenes/IdeaScene";
import { ClosingScene } from "@/components/demo/scenes/ClosingScene";
import { useTheme } from "@/components/theme/ThemeProvider";
import { DEMO_SCENES, DEMO_TOTAL_MS, type DemoSceneId } from "@/lib/demo/scenes";
import { DEMO_VOICEOVER } from "@/lib/demo/data";
import { demoEase, demoFullBleedVariants } from "@/lib/demo/motion";
import { DemoPlaybackProvider } from "@/lib/demo/playback-context";

const NAV_TO_SCENE: Record<string, DemoSceneId> = {
  Dashboard: "problem",
  Roles: "company",
  Candidates: "profile",
  Discover: "problem",
  Conversations: "conversation",
  Connections: "match",
  Pipeline: "whyMatch",
  Board: "whyMatch",
  Interviews: "conversation",
  Saved: "profile",
  "My profile": "profile",
  Settings: "problem",
};

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Cinematic product film — ~3:00, no captions.
 * Smooth rAF clock + soft crossfades (no hard cuts / stutter).
 */
export function ProductDemoExperience({
  initialAutoplay = true,
  recordMode = false,
}: {
  initialAutoplay?: boolean;
  /** Hide transport chrome for clean MP4 capture. */
  recordMode?: boolean;
}) {
  const { setTheme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [wantPlaying, setWantPlaying] = useState(initialAutoplay);
  const playing = wantPlaying && !reducedMotion;
  const [elapsedInScene, setElapsedInScene] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [veil, setVeil] = useState(false);
  const sceneStartedAt = useRef(0);
  const rafRef = useRef<number | null>(null);
  const advancingRef = useRef(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wasPlayingRef = useRef(false);

  const scene = DEMO_SCENES[sceneIndex];
  const isLast = sceneIndex >= DEMO_SCENES.length - 1;
  const showChrome = Boolean(scene.showChrome);

  const goTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(DEMO_SCENES.length - 1, index));
    advancingRef.current = false;
    setVeil(true);
    window.setTimeout(() => {
      setSceneIndex(next);
      setElapsedInScene(0);
      sceneStartedAt.current = performance.now();
      window.setTimeout(() => setVeil(false), 280);
    }, 220);
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      setWantPlaying(false);
      return;
    }
    goTo(sceneIndex + 1);
  }, [goTo, isLast, sceneIndex]);

  const prev = useCallback(() => {
    goTo(sceneIndex - 1);
    setWantPlaying(false);
  }, [goTo, sceneIndex]);

  const replay = useCallback(() => {
    advancingRef.current = false;
    sceneStartedAt.current = performance.now();
    setElapsedInScene(0);
    setSceneIndex(0);
    setWantPlaying(true);
    setTheme("light");
    setVeil(false);
  }, [setTheme]);

  const togglePlay = useCallback(() => {
    setWantPlaying((prev) => {
      if (prev) return false;
      sceneStartedAt.current = performance.now() - elapsedInScene;
      return true;
    });
  }, [elapsedInScene]);

  useEffect(() => {
    if (playing && !wasPlayingRef.current) {
      sceneStartedAt.current = performance.now() - elapsedInScene;
    }
    wasPlayingRef.current = playing;
  }, [playing, elapsedInScene]);

  useEffect(() => {
    sceneStartedAt.current = performance.now();
    advancingRef.current = false;
  }, [sceneIndex]);

  useEffect(() => {
    if (!playing || reducedMotion) {
      document.documentElement.style.removeProperty("cursor");
      document.body.style.removeProperty("cursor");
      return;
    }
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";
    return () => {
      document.documentElement.style.removeProperty("cursor");
      document.body.style.removeProperty("cursor");
    };
  }, [playing, reducedMotion]);

  useEffect(() => {
    setTheme("light");
  }, [scene.id, setTheme]);

  useEffect(() => () => setTheme("light"), [setTheme]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("/demo") || href.startsWith("#")) return;
      if (href.startsWith("http") || href.startsWith("mailto:")) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Smooth rAF clock — avoids 100ms timeout stutter between scenes.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    if (sceneStartedAt.current === 0) {
      sceneStartedAt.current = performance.now();
    }

    const tick = (now: number) => {
      const elapsed = now - sceneStartedAt.current;
      setElapsedInScene(elapsed);
      if (elapsed >= scene.durationMs && !advancingRef.current) {
        if (sceneIndex >= DEMO_SCENES.length - 1) {
          setWantPlaying(false);
          setElapsedInScene(scene.durationMs);
          return;
        }
        advancingRef.current = true;
        setVeil(true);
        window.setTimeout(() => {
          sceneStartedAt.current = performance.now();
          setElapsedInScene(0);
          setSceneIndex((i) => i + 1);
          window.setTimeout(() => {
            setVeil(false);
            advancingRef.current = false;
          }, 280);
        }, 220);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, scene.durationMs, sceneIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
        setWantPlaying(false);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
      } else if (event.key === "Home") {
        event.preventDefault();
        replay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, replay, togglePlay]);

  const progress =
    ((sceneIndex + Math.min(1, elapsedInScene / Math.max(1, scene.durationMs))) /
      DEMO_SCENES.length) *
    100;

  const totalElapsedApprox =
    DEMO_SCENES.slice(0, sceneIndex).reduce((s, sc) => s + sc.durationMs, 0) +
    Math.min(elapsedInScene, scene.durationMs);

  const body = (() => {
    switch (scene.id) {
      case "opening":
        return <OpeningScene />;
      case "problem":
        return <ProblemScene />;
      case "profile":
        return <ProfileScene />;
      case "company":
        return <RoleScene />;
      case "match":
        return <MatchScene />;
      case "whyMatch":
        return <WhyMatchScene />;
      case "conversation":
        return (
          <div className="pointer-events-none select-none">
            <ConversationScene />
          </div>
        );
      case "idea":
        return <IdeaScene />;
      case "closing":
        return <ClosingScene onReplay={replay} />;
      default:
        return null;
    }
  })();

  return (
    <DemoPlaybackProvider
      value={{
        sceneId: scene.id,
        elapsedMs: elapsedInScene,
        playing,
        reducedMotion,
      }}
    >
      <div
        className={`demo-experience relative flex h-[100dvh] min-h-[100dvh] flex-1 flex-col overflow-hidden bg-mingle-surface ${
          playing ? "demo-playing" : ""
        }`}
      >
        <motion.div
          className={`pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-mingle-accent-pink via-mingle-accent-purple to-mingle-accent-blue ${
            recordMode ? "opacity-0" : ""
          }`}
          style={{ scaleX: progress / 100 }}
          transition={{ duration: 0.15, ease: "linear" }}
        />

        <div
          ref={stageRef}
          className="absolute inset-0 flex flex-col overflow-hidden"
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 bg-white"
            animate={{ opacity: veil && !reducedMotion ? 0.55 : 0 }}
            transition={{ duration: 0.4, ease: demoEase }}
          />

          <div className="relative flex min-h-0 flex-1 flex-col">
            {showChrome ? (
              <DemoChrome
                activeNav={scene.chromeNav ?? "Dashboard"}
                title={scene.chromeTitle ?? "mingle"}
                audience={scene.audience ?? "company"}
                contentKey={scene.id}
                fillMain={scene.id === "conversation"}
                reducedMotion={reducedMotion}
                onNavSelect={(label) => {
                  const target = NAV_TO_SCENE[label];
                  if (!target) return;
                  const index = DEMO_SCENES.findIndex(
                    (item) => item.id === target,
                  );
                  if (index >= 0) {
                    goTo(index);
                    setWantPlaying(false);
                  }
                }}
              >
                <AnimatePresence mode="sync">
                  <motion.div
                    key={scene.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.45, ease: demoEase }}
                    className="min-h-0 w-full"
                  >
                    {body}
                  </motion.div>
                </AnimatePresence>
              </DemoChrome>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={scene.id}
                  variants={reducedMotion ? undefined : demoFullBleedVariants}
                  initial={reducedMotion ? false : "initial"}
                  animate="animate"
                  exit={reducedMotion ? undefined : "exit"}
                  className="flex min-h-0 flex-1 flex-col overflow-hidden bg-mingle-surface"
                >
                  {body}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <DemoFocusHighlight
            rootRef={stageRef}
            sceneId={scene.id}
            elapsedMs={elapsedInScene}
            enabled={playing && !veil}
            reducedMotion={reducedMotion}
          />

          <DemoGuidedCursor
            rootRef={stageRef}
            sceneId={scene.id}
            elapsedMs={elapsedInScene}
            enabled={playing && !veil}
            reducedMotion={reducedMotion}
          />
        </div>

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-50 ${
            recordMode ? "hidden" : ""
          }`}
          onMouseEnter={() => setControlsOpen(true)}
          onMouseLeave={() => setControlsOpen(false)}
        >
          <div
            className={`pointer-events-auto border-t border-mingle-border/40 bg-mingle-surface/95 transition-opacity duration-300 ${
              controlsOpen || !playing ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6">
              <button
                type="button"
                data-demo-play
                onClick={togglePlay}
                className="mingle-btn-primary min-w-[5rem] text-[11px]"
                aria-label={playing ? "Pause demo" : "Play demo"}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={prev}
                disabled={sceneIndex === 0}
                className="mingle-btn-secondary text-[11px] disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  next();
                  setWantPlaying(false);
                }}
                disabled={isLast}
                className="mingle-btn-secondary text-[11px] disabled:opacity-40"
              >
                Next
              </button>
              <button
                type="button"
                onClick={replay}
                className="mingle-btn-secondary text-[11px]"
              >
                Restart
              </button>

              <div
                className="mx-1 hidden items-center gap-1 sm:flex"
                role="tablist"
                aria-label="Demo scenes"
              >
                {DEMO_SCENES.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={index === sceneIndex}
                    aria-label={`Scene ${index + 1}: ${item.id}`}
                    onClick={() => {
                      goTo(index);
                      setWantPlaying(false);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === sceneIndex
                        ? "w-5 bg-mingle-accent-purple"
                        : "w-1.5 bg-mingle-border hover:bg-mingle-text-muted"
                    }`}
                  />
                ))}
              </div>

              <span className="ml-auto hidden text-[10px] tabular-nums text-mingle-text-secondary sm:inline">
                {Math.floor(totalElapsedApprox / 1000)}s /{" "}
                {Math.round(DEMO_TOTAL_MS / 1000)}s
              </span>

              <button
                type="button"
                onClick={() => setShowScript((value) => !value)}
                className="text-[10px] font-medium text-mingle-text-secondary underline decoration-dotted hover:text-mingle-text"
              >
                {showScript ? "Hide script" : "Voiceover"}
              </button>
            </div>

            {showScript ? (
              <div className="border-t border-mingle-border bg-mingle-bg/80 px-4 py-3 sm:px-6">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-mingle-text-secondary">
                  {DEMO_VOICEOVER}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DemoPlaybackProvider>
  );
}
