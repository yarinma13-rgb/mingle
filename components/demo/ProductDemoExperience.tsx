"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DemoChrome } from "@/components/demo/DemoChrome";
import { DemoCaptions } from "@/components/demo/DemoCaptions";
import { OpeningScene } from "@/components/demo/scenes/OpeningScene";
import { ProblemScene } from "@/components/demo/scenes/ProblemScene";
import { CompanyScene } from "@/components/demo/scenes/CompanyScene";
import { ProfileScene } from "@/components/demo/scenes/ProfileScene";
import { MatchScene } from "@/components/demo/scenes/MatchScene";
import { ConversationScene } from "@/components/demo/scenes/ConversationScene";
import { RecommendationsScene } from "@/components/demo/scenes/RecommendationsScene";
import { ClosingScene } from "@/components/demo/scenes/ClosingScene";
import { DEMO_SCENES, type DemoSceneId } from "@/lib/demo/scenes";
import { DEMO_VOICEOVER } from "@/lib/demo/data";

const NAV_TO_SCENE: Record<string, DemoSceneId> = {
  Dashboard: "company",
  Roles: "problem",
  Candidates: "profile",
  Conversations: "conversation",
  Pipeline: "company",
  Board: "company",
  Interviews: "conversation",
  "My profile": "company",
  Settings: "company",
};

function activeCaptionLines(
  sceneIndex: number,
  elapsedInSceneMs: number,
): string[] {
  const scene = DEMO_SCENES[sceneIndex];
  if (!scene) return [];
  let current = scene.captions[0]?.lines ?? [];
  for (const caption of scene.captions) {
    if ((caption.atMs ?? 0) <= elapsedInSceneMs) {
      current = caption.lines;
    }
  }
  return current;
}

export function ProductDemoExperience({
  initialAutoplay = true,
}: {
  initialAutoplay?: boolean;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(initialAutoplay);
  const [elapsedInScene, setElapsedInScene] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sceneStartedAt = useRef(performance.now());
  const timerRef = useRef<number | null>(null);

  const scene = DEMO_SCENES[sceneIndex];
  const isLast = sceneIndex >= DEMO_SCENES.length - 1;

  const goTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(DEMO_SCENES.length - 1, index));
    setSceneIndex(next);
    setElapsedInScene(0);
    sceneStartedAt.current = performance.now();
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      setPlaying(false);
      return;
    }
    goTo(sceneIndex + 1);
  }, [goTo, isLast, sceneIndex]);

  const prev = useCallback(() => {
    goTo(sceneIndex - 1);
    setPlaying(false);
  }, [goTo, sceneIndex]);

  const replay = useCallback(() => {
    sceneStartedAt.current = performance.now();
    setElapsedInScene(0);
    setSceneIndex(0);
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((value) => {
      if (!value) {
        // Starting playback — always restart the current scene clock so
        // idle time with autoplay off does not skip the scene immediately.
        sceneStartedAt.current = performance.now();
        setElapsedInScene(0);
      }
      return !value;
    });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    if (media.matches) setPlaying(false);
    const onChange = () => {
      setReducedMotion(media.matches);
      if (media.matches) setPlaying(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  /** Keep the recording on /demo — reused product tiles may link to live app routes. */
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

  useEffect(() => {
    sceneStartedAt.current = performance.now();
    setElapsedInScene(0);
  }, [sceneIndex]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const tick = () => {
      const elapsed = performance.now() - sceneStartedAt.current;
      setElapsedInScene(elapsed);
      const remaining = scene.durationMs - elapsed;
      if (remaining <= 0) {
        if (sceneIndex >= DEMO_SCENES.length - 1) {
          setPlaying(false);
          setElapsedInScene(scene.durationMs);
          return;
        }
        setSceneIndex((i) => i + 1);
        return;
      }
      timerRef.current = window.setTimeout(tick, Math.min(100, remaining));
    };

    timerRef.current = window.setTimeout(tick, 50);
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
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
        setPlaying(false);
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

  const captions = useMemo(
    () => activeCaptionLines(sceneIndex, elapsedInScene),
    [elapsedInScene, sceneIndex],
  );

  const showChrome = Boolean(scene.showChrome);
  const progress =
    ((sceneIndex + Math.min(1, elapsedInScene / scene.durationMs)) /
      DEMO_SCENES.length) *
    100;

  const body = (() => {
    switch (scene.id) {
      case "opening":
        return <OpeningScene />;
      case "problem":
        return <ProblemScene />;
      case "company":
        return (
          <CompanyScene
            onOpenCandidate={() => {
              goTo(DEMO_SCENES.findIndex((item) => item.id === "profile"));
              setPlaying(false);
            }}
          />
        );
      case "profile":
        return <ProfileScene />;
      case "match":
        return <MatchScene />;
      case "conversation":
        return (
          <div className="pointer-events-none select-none">
            <ConversationScene />
          </div>
        );
      case "recommendations":
        return <RecommendationsScene />;
      case "closing":
        return <ClosingScene onReplay={replay} />;
      default:
        return null;
    }
  })();

  return (
    <div className="demo-experience relative flex min-h-screen flex-1 flex-col bg-transparent">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 h-0.5 bg-mingle-border/40"
        aria-hidden
      >
        <div
          className="h-full bg-gradient-to-r from-mingle-accent-pink via-mingle-accent-purple to-mingle-accent-blue transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-3 pb-20 pt-4 sm:px-5 sm:pt-5 lg:px-8">
        <div className="relative flex min-h-[calc(100vh-6.5rem)] flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={
                reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative flex min-h-0 flex-1 flex-col"
            >
              {showChrome ? (
                <DemoChrome
                  activeNav={scene.chromeNav ?? "Dashboard"}
                  title={scene.chromeTitle ?? "mingle"}
                  onNavSelect={(label) => {
                    const target = NAV_TO_SCENE[label];
                    if (!target) return;
                    const index = DEMO_SCENES.findIndex(
                      (item) => item.id === target,
                    );
                    if (index >= 0) {
                      goTo(index);
                      setPlaying(false);
                    }
                  }}
                >
                  {body}
                </DemoChrome>
              ) : (
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-mingle-border/60 bg-mingle-surface/70 shadow-mingle backdrop-blur-sm">
                  {body}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <DemoCaptions
            lines={
              scene.id === "opening" || scene.id === "closing" ? [] : captions
            }
            visible={scene.id !== "opening" && scene.id !== "closing"}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-mingle-border/80 bg-mingle-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 lg:px-8">
          <button
            type="button"
            onClick={togglePlay}
            className="mingle-btn-primary min-w-[5.5rem] text-xs"
            aria-label={playing ? "Pause demo" : "Play demo"}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={prev}
            disabled={sceneIndex === 0}
            className="mingle-btn-secondary text-xs disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              next();
              setPlaying(false);
            }}
            disabled={isLast}
            className="mingle-btn-secondary text-xs disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={replay}
            className="mingle-btn-secondary text-xs"
          >
            Restart
          </button>

          <div className="mx-1 hidden items-center gap-1.5 sm:flex" role="tablist" aria-label="Demo scenes">
            {DEMO_SCENES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === sceneIndex}
                aria-label={`Scene ${index + 1}`}
                onClick={() => {
                  goTo(index);
                  setPlaying(false);
                }}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === sceneIndex
                    ? "w-5 bg-mingle-accent-purple"
                    : "bg-mingle-border hover:bg-mingle-text-muted"
                }`}
              />
            ))}
          </div>

          <p className="ml-auto hidden text-[11px] text-mingle-text-secondary md:block">
            Space play/pause · ← → scenes · optimized for 1440px recording
          </p>

          <button
            type="button"
            onClick={() => setShowScript((value) => !value)}
            className="text-[11px] font-medium text-mingle-text-secondary underline decoration-dotted hover:text-mingle-text"
          >
            {showScript ? "Hide voiceover" : "Voiceover script"}
          </button>
        </div>

        {showScript ? (
          <div className="border-t border-mingle-border bg-mingle-bg/80 px-3 py-3 sm:px-5 lg:px-8">
            <pre className="mx-auto max-w-[1440px] whitespace-pre-wrap font-sans text-xs leading-relaxed text-mingle-text-secondary">
              {DEMO_VOICEOVER}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
