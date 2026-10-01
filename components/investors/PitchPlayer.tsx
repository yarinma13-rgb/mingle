"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useEffectEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  folderDurationMs,
  type PitchFolder,
  type PitchFolderId,
  PITCH_FOLDERS,
} from "@/lib/investors/folders";
import { PitchSceneView } from "@/components/investors/PitchSceneView";

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5L8 5.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z" />
    </svg>
  );
}

type PitchPlayerProps = {
  folder: PitchFolder;
  onClose: () => void;
  onOpenFolder: (id: PitchFolderId) => void;
};

export function PitchPlayer({ folder, onClose, onOpenFolder }: PitchPlayerProps) {
  const totalMs = useMemo(() => folderDurationMs(folder), [folder]);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);

  const sceneIndex = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < folder.scenes.length; i += 1) {
      acc += folder.scenes[i].durationMs;
      if (elapsed < acc) return i;
    }
    return folder.scenes.length - 1;
  }, [elapsed, folder.scenes]);

  const scene = folder.scenes[sceneIndex];

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTs.current = null;
  }, []);

  const tick = useEffectEvent((ts: number) => {
    if (lastTs.current == null) lastTs.current = ts;
    const delta = ts - lastTs.current;
    lastTs.current = ts;
    setElapsed((prev) => {
      const next = prev + delta;
      if (next >= totalMs) {
        setPlaying(false);
        return totalMs;
      }
      return next;
    });
    rafRef.current = requestAnimationFrame(tick);
  });

  useEffect(() => {
    if (!playing) {
      stopRaf();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
    return stopRaf;
  }, [playing, stopRaf, tick]);

  useEffect(() => {
    setPlaying(false);
    setStarted(false);
    setElapsed(0);
    stopRaf();
  }, [folder.id, stopRaf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        if (!started) {
          setStarted(true);
          setPlaying(true);
        } else {
          setPlaying((p) => !p);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, started]);

  const nextFolder = PITCH_FOLDERS.find((f) => f.order === folder.order + 1);

  const seek = (value: number) => {
    setElapsed(Math.min(totalMs, Math.max(0, value)));
    if (!started) setStarted(true);
  };

  return (
    <div className="inv-modal" role="dialog" aria-modal="true" aria-label={folder.labelHe}>
      <button
        type="button"
        className="inv-modal-backdrop"
        aria-label="סגירה"
        onClick={onClose}
      />
      <motion.div
        className="inv-modal-panel"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
      >
        <div className="inv-player-top">
          <div className="inv-player-title">
            <strong className="inv-he">
              {folder.order}. {folder.labelHe}
              <span dir="ltr"> · {folder.labelEn}</span>
            </strong>
            <span>{folder.tagline}</span>
          </div>
          <button type="button" className="inv-player-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="inv-stage">
          <div className="inv-stage-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${folder.id}-${scene.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <PitchSceneView scene={scene} />
              </motion.div>
            </AnimatePresence>
          </div>

          {!started ? (
            <div className="inv-idle">
              <button
                type="button"
                className="inv-idle-btn"
                onClick={() => {
                  setStarted(true);
                  setPlaying(true);
                }}
              >
                <PlayIcon />
                Play demo · ~50s
              </button>
            </div>
          ) : null}
        </div>

        <div className="inv-controls">
          <button
            type="button"
            className="inv-playbtn"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => {
              if (!started) setStarted(true);
              if (elapsed >= totalMs) {
                setElapsed(0);
                setPlaying(true);
                return;
              }
              setPlaying((p) => !p);
            }}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <input
            className="inv-progress"
            type="range"
            min={0}
            max={totalMs}
            step={100}
            value={elapsed}
            aria-label="Progress"
            onChange={(e) => seek(Number(e.target.value))}
          />
          <div className="inv-time">
            {formatTime(elapsed)} / {formatTime(totalMs)}
          </div>
        </div>

        <div className="inv-next-row">
          <button
            type="button"
            className="inv-next"
            disabled={!nextFolder}
            onClick={() => nextFolder && onOpenFolder(nextFolder.id)}
          >
            {nextFolder
              ? `הבא: ${nextFolder.labelHe} →`
              : "סוף המסלול · End of deck"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
