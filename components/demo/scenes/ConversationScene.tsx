"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { RelationshipContextPanel } from "@/components/messaging/RelationshipContextPanel";
import {
  DEMO_ALIGNED_FACTORS,
  DEMO_COMPANY,
  DEMO_EMMA,
  DEMO_EMMA_MATCH_REPORT,
  DEMO_EXPLORE_FACTORS,
  DEMO_IDS,
  DEMO_MESSAGES,
  DEMO_TIMELINE,
} from "@/lib/demo/data";
import { useDemoPlayback } from "@/lib/demo/playback-context";
import { isTypingComplete, typeProgress } from "@/lib/demo/typewriter";
import { demoEase } from "@/lib/demo/motion";

const DRAFT_TEXT =
  "Perfect — I'll bring a few product examples for Thursday.";
const TYPE_START_MS = 4500;
const SEND_AT_MS = 10000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Conversation + relationship context using the same visual language as
 * ConversationScreen / RelationshipContextPanel — local state only,
 * with monday-style in-composer auto-typing during autoplay.
 */
export function ConversationScene() {
  const { elapsedMs, reducedMotion, playing } = useDemoPlayback();
  const threadRef = useRef<HTMLDivElement | null>(null);

  const draft = reducedMotion
    ? elapsedMs >= TYPE_START_MS
      ? DRAFT_TEXT
      : ""
    : typeProgress(DRAFT_TEXT, TYPE_START_MS, elapsedMs, 30);
  const typingDone = isTypingComplete(
    DRAFT_TEXT,
    TYPE_START_MS,
    elapsedMs,
    30,
  );
  const sent = elapsedMs >= SEND_AT_MS && (reducedMotion || typingDone);
  const showCaret =
    playing && !sent && elapsedMs >= TYPE_START_MS && !typingDone && !reducedMotion;

  useEffect(() => {
    if (!sent || !threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [sent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"
    >
      <div
        data-demo-target="chat-thread"
        className="flex h-[min(520px,58vh)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-mingle-border bg-mingle-surface shadow-mingle"
      >
        <div className="flex items-center gap-3 border-b border-mingle-border p-4">
          <Avatar
            photo={DEMO_EMMA.photo}
            initials={DEMO_EMMA.initials}
            gender={DEMO_EMMA.gender}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-mingle-text">
              {DEMO_EMMA.name}
            </p>
            <p className="truncate text-xs text-mingle-text-secondary">
              {DEMO_EMMA.headline} · {DEMO_COMPANY.name}
            </p>
          </div>
          <span className="ml-auto hidden rounded-full bg-mingle-success/15 px-3 py-1 text-[11px] font-semibold text-mingle-success sm:inline">
            Interview booked
          </span>
        </div>

        <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-4 rounded-xl border border-mingle-border bg-mingle-bg/80 px-3 py-2.5 text-xs text-mingle-text-secondary">
            Design conversation scheduled — Thursday afternoon.
          </div>
          <div className="flex flex-col gap-1">
            <p className="my-3 text-center text-[11px] font-medium uppercase tracking-wide text-mingle-text-secondary">
              Today
            </p>
            {DEMO_MESSAGES.map((message) => {
              const isOwn = message.sender_id === DEMO_IDS.companyUser;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                      isOwn
                        ? "bg-mingle-cta text-white"
                        : "bg-mingle-bg text-mingle-text"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isOwn ? "text-white/60" : "text-mingle-text-secondary"
                      }`}
                    >
                      {formatTime(message.created_at)}
                      {isOwn ? " · Read" : ""}
                    </p>
                  </div>
                </div>
              );
            })}

            <AnimatePresence>
              {sent ? (
                <motion.div
                  key="live-draft"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: demoEase }}
                  className="flex justify-end"
                >
                  <div className="max-w-[78%] rounded-2xl bg-mingle-cta px-4 py-2.5 text-sm text-white shadow-[0_8px_24px_rgba(62,107,224,0.22)]">
                    <p className="whitespace-pre-wrap">{DRAFT_TEXT}</p>
                    <p className="mt-1 text-[10px] text-white/60">Just now · Sent</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div data-demo-target="chat-composer" className="border-t border-mingle-border p-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex min-h-[2.65rem] flex-1 items-center rounded-full border px-4 py-2.5 text-sm transition-colors duration-300 ${
                draft && !sent
                  ? "border-mingle-accent-blue/50 bg-mingle-white text-mingle-text shadow-[0_0_0_3px_rgba(62,107,224,0.08)]"
                  : "border-mingle-border bg-mingle-bg text-mingle-text-muted"
              }`}
            >
              {sent ? (
                <span className="text-mingle-text-muted">Write a message</span>
              ) : draft ? (
                <span className="demo-typed-line">
                  {draft}
                  {showCaret ? <span className="demo-caret" aria-hidden /> : null}
                </span>
              ) : (
                "Write a message"
              )}
            </div>
            <div
              data-demo-target="chat-send"
              aria-hidden
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                sent || (typingDone && !sent)
                  ? "bg-mingle-cta text-white shadow-[0_8px_20px_rgba(62,107,224,0.28)]"
                  : "bg-mingle-bg text-mingle-text-secondary"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4.5 12 20 4.5 12.5 20l-2-6.5L4.5 12Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div data-demo-target="chat-context">
        <RelationshipContextPanel
          connectionId={DEMO_IDS.connection}
          score={DEMO_EMMA_MATCH_REPORT.overall}
          alignedFactors={DEMO_ALIGNED_FACTORS}
          exploreFactors={DEMO_EXPLORE_FACTORS}
          stage="interview_booked"
          timeline={DEMO_TIMELINE}
        />
      </div>
    </motion.div>
  );
}
