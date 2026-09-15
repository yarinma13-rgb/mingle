"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DemoChrome } from "@/components/demo/DemoChrome";
import { DemoCaptions } from "@/components/demo/DemoCaptions";
import { OpeningScene } from "@/components/demo/scenes/OpeningScene";
import { ProblemScene } from "@/components/demo/scenes/ProblemScene";
import { IntroduceScene } from "@/components/demo/scenes/IntroduceScene";
import { RoleScene } from "@/components/demo/scenes/RoleScene";
import { ProfileScene } from "@/components/demo/scenes/ProfileScene";
import { MatchScene } from "@/components/demo/scenes/MatchScene";
import { TalentScene } from "@/components/demo/scenes/TalentScene";
import { MingleMomentScene } from "@/components/demo/scenes/MingleMomentScene";
import { ConversationScene } from "@/components/demo/scenes/ConversationScene";
import { RecommendationsScene } from "@/components/demo/scenes/RecommendationsScene";
import { BoardScene } from "@/components/demo/scenes/BoardScene";
import { Phase2Scene } from "@/components/demo/scenes/Phase2Scene";
import { ClosingScene } from "@/components/demo/scenes/ClosingScene";
import { useTheme } from "@/components/theme/ThemeProvider";
import { DEMO_SCENES, type DemoSceneId } from "@/lib/demo/scenes";
import { DEMO_VOICEOVER } from "@/lib/demo/data";
import {
  demoEase,
  demoFullBleedVariants,
} from "@/lib/demo/motion";

const NAV_TO_SCENE: Record<string, DemoSceneId> = {
  Dashboard: "introduce",
  Roles: "company",
  Candidates: "profile",
  Discover: "talent",
  Conversations: "conversation",
  Connections: "talent",
  Pipeline: "board",
  Board: "board",
  Interviews: "conversation",
  Saved: "talent",
  "My profile": "profile",
  Settings: "introduce",
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
  const { setTheme } = useTheme();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(initialAutoplay);
  const [elapsedInScene, setElapsedInScene] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [veil, setVeil] = useState(false);
  const sceneStartedAt = useRef(performance.now());
  const timerRef = useRef<number | null>(null);

  const scene = DEMO_SCENES[sceneIndex];
  const isLast = sceneIndex >= DEMO_SCENES.length - 1;
  const showChrome = Boolean(scene.showChrome);

  const goTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(DEMO_SCENES.length - 1, index));
    setVeil(true);
    window.setTimeout(() => {
      setSceneIndex(next);
      setElapsedInScene(0);
      sceneStartedAt.current = performance.now();
      window.setTimeout(() => setVeil(false), 180);
    }, 120);
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
    setTheme("light");
    setVeil(false);
  }, [setTheme]);

  const togglePlay = useCallback(() => {
    setPlaying((prev) => {
      if (prev) return false;
      sceneStartedAt.current = performance.now();
      return true;
    });
  }, []);

  const wasPlayingRef = useRef(playing);
  useEffect(() => {
    if (playing && !wasPlayingRef.current) {
      setElapsedInScene(0);
      sceneStartedAt.current = performance.now();
    }
    wasPlayingRef.current = playing;
  }, [playing]);

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

  useEffect(() => {
    if (scene.forceDark) {
      setTheme("dark");
      return () => setTheme("light");
    }
    setTheme("light");
  }, [scene.forceDark, scene.id, setTheme]);

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
        // Soft veil advance for autoplay continuity
        setVeil(true);
        window.setTimeout(() => {
          setSceneIndex((i) => i + 1);
          window.setTimeout(() => setVeil(false), 180);
        }, 140);
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

  const progress =
    ((sceneIndex + Math.min(1, elapsedInScene / scene.durationMs)) /
      DEMO_SCENES.length) *
    100;

  const jumpProfile = () => {
    const index = DEMO_SCENES.findIndex((item) => item.id === "profile");
    if (index >= 0) {
      goTo(index);
      setPlaying(false);
    }
  };

  const body = (() => {
    switch (scene.id) {
      case "opening":
        return <OpeningScene />;
      case "problem":
        return <ProblemScene />;
      case "introduce":
        return <IntroduceScene onOpenCandidate={jumpProfile} />;
      case "company":
        return <RoleScene />;
      case "profile":
        return <ProfileScene />;
      case "match":
        return <MatchScene />;
      case "talent":
        return <TalentScene />;
      case "mingleMoment":
        return <MingleMomentScene />;
      case "conversation":
        return (
          <div className="pointer-events-none select-none">
            <ConversationScene />
          </div>
        );
      case "recommendations":
        return <RecommendationsScene />;
      case "board":
        return <BoardScene />;
      case "darkMode":
        return <IntroduceScene />;
      case "phase2":
        return <Phase2Scene />;
      case "closing":
        return <ClosingScene onReplay={replay} />;
      default:
        return null;
    }
  })();

  const hideCaptions =
    scene.id === "opening" ||
    scene.id === "closing" ||
    scene.id === "mingleMoment" ||
    scene.id === "phase2";

  return (
    <div className="demo-experience relative flex min-h-screen flex-1 flex-col bg-transparent">
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-mingle-accent-pink via-mingle-accent-purple to-mingle-accent-blue"
        style={{ scaleX: progress / 100 }}
        transition={{ duration: 0.2, ease: "linear" }}
      />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-3 pb-14 pt-3 sm:px-5 sm:pt-4 lg:px-8">
        <div className="relative flex min-h-[calc(100vh-5rem)] flex-1 flex-col">
          {/* Soft transition veil — monday calm, not a hard cut */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl bg-gradient-to-b from-white/70 via-white/40 to-transparent"
            animate={{ opacity: veil && !reducedMotion ? 1 : 0 }}
            transition={{ duration: 0.22, ease: demoEase }}
          />

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
                  setPlaying(false);
                }
              }}
            >
              {body}
            </DemoChrome>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.id}
                variants={reducedMotion ? undefined : demoFullBleedVariants}
                initial={reducedMotion ? false : "initial"}
                animate="animate"
                exit={reducedMotion ? undefined : "exit"}
                className={`flex flex-1 flex-col overflow-hidden ${
                  scene.fullBleed
                    ? ""
                    : "rounded-2xl border border-mingle-border/50 bg-mingle-surface/85 shadow-[0_24px_80px_rgba(37,34,56,0.10)] backdrop-blur-sm"
                }`}
              >
                {body}
              </motion.div>
            </AnimatePresence>
          )}

          <DemoCaptions lines={hideCaptions ? [] : captions} visible={!hideCaptions} />
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-50"
        onMouseEnter={() => setControlsOpen(true)}
        onMouseLeave={() => setControlsOpen(false)}
      >
        <div
          className={`border-t border-mingle-border/60 bg-mingle-surface/90 backdrop-blur-xl transition-all duration-300 ${
            controlsOpen || !playing
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-25 hover:opacity-100"
          }`}
        >
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 lg:px-8">
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
                setPlaying(false);
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
                    setPlaying(false);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === sceneIndex
                      ? "w-5 bg-mingle-accent-purple"
                      : "w-1.5 bg-mingle-border hover:bg-mingle-text-muted"
                  }`}
                />
              ))}
            </div>

            <p className="ml-auto hidden text-[10px] text-mingle-text-secondary lg:block">
              Space · ← → · 1440px
            </p>

            <button
              type="button"
              onClick={() => setShowScript((value) => !value)}
              className="text-[10px] font-medium text-mingle-text-secondary underline decoration-dotted hover:text-mingle-text"
            >
              {showScript ? "Hide script" : "Voiceover"}
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
    </div>
  );
}
