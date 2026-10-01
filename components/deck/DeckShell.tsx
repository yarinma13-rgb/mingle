"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { DECK_SLIDES, MAIN_SLIDE_COUNT } from "@/components/deck/slides/registry";
import "@/components/deck/deck.css";

type Mode = "main" | "all";

export function DeckShell() {
  const [mode, setMode] = useState<Mode>("main");
  const [index, setIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);

  const slides = useMemo(
    () =>
      mode === "main"
        ? DECK_SLIDES.filter((slide) => slide.section === "main")
        : DECK_SLIDES,
    [mode],
  );

  const safeIndex = Math.min(index, slides.length - 1);
  const current = slides[safeIndex] ?? slides[0];

  useEffect(() => {
    setIndex((prev) => Math.min(prev, slides.length - 1));
  }, [slides.length]);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
    },
    [slides.length],
  );

  const goNext = useCallback(() => go(safeIndex + 1), [go, safeIndex]);
  const goPrev = useCallback(() => go(safeIndex - 1), [go, safeIndex]);

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

      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0);
      } else if (event.key === "End") {
        event.preventDefault();
        go(slides.length - 1);
      } else if (event.key === "n" || event.key === "N") {
        setNotesOpen((open) => !open);
      } else if (event.key === "a" || event.key === "A") {
        setMode((prev) => {
          const next = prev === "main" ? "all" : "main";
          setIndex(0);
          return next;
        });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, goNext, goPrev, slides.length]);

  const onRootKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && notesOpen) {
      setNotesOpen(false);
    }
  };

  return (
    <div
      className="deck-root"
      tabIndex={0}
      role="application"
      aria-label="מצגת mingle"
      onKeyDown={onRootKeyDown}
    >
      <div className="deck-stage">
        <article className="deck-slide" aria-live="polite">
          {current.render()}
        </article>

        <button
          type="button"
          className="deck-nav-hit prev"
          aria-label="שקופית קודמת"
          onClick={goPrev}
        />
        <button
          type="button"
          className="deck-nav-hit next"
          aria-label="שקופית הבאה"
          onClick={goNext}
        />
      </div>

      {notesOpen && current.notes ? (
        <aside className="deck-notes" aria-label="Speaker notes">
          {current.notes}
        </aside>
      ) : null}

      <footer className="deck-chrome">
        <div className="deck-progress" aria-label="התקדמות">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              className="deck-dot"
              data-active={slideIndex === safeIndex ? "true" : "false"}
              data-section={slide.section}
              aria-label={slide.label}
              title={slide.label}
              onClick={() => go(slideIndex)}
            />
          ))}
        </div>

        <div className="deck-chrome-meta">
          <span>
            {safeIndex + 1} / {slides.length}
            {mode === "main" ? ` · ${MAIN_SLIDE_COUNT} main` : " · + Appendix"}
          </span>
          <button
            type="button"
            className="deck-chrome-btn"
            data-active={mode === "all" ? "true" : "false"}
            onClick={() => {
              setMode((prev) => (prev === "main" ? "all" : "main"));
              setIndex(0);
            }}
          >
            Appendix
          </button>
          <button
            type="button"
            className="deck-chrome-btn"
            data-active={notesOpen ? "true" : "false"}
            onClick={() => setNotesOpen((open) => !open)}
          >
            Notes
          </button>
        </div>
      </footer>
    </div>
  );
}
