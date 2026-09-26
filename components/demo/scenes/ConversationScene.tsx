"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { RelationshipContextPanel } from "@/components/messaging/RelationshipContextPanel";
import {
  DEMO_ALIGNED_FACTORS,
  DEMO_COMPANY,
  DEMO_DANIEL,
  DEMO_EMMA_MATCH_REPORT,
  DEMO_EXPLORE_FACTORS,
  DEMO_IDS,
  DEMO_MESSAGES,
  DEMO_ROLE,
  DEMO_TIMELINE,
} from "@/lib/demo/data";
import { useDemoPlayback } from "@/lib/demo/playback-context";
import { isTypingComplete, typeProgress } from "@/lib/demo/typewriter";
import { demoEase } from "@/lib/demo/motion";

const DRAFT_TEXT =
  "Looking forward to Thursday — I'll bring a few product examples.";
const TYPE_START_MS = 11000;
const SEND_AT_MS = 17000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Scene 07 — Match → Start conversation → professional chat.
 */
export function ConversationScene() {
  const { elapsedMs, reducedMotion, playing } = useDemoPlayback();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const showChat = reducedMotion || elapsedMs >= 4500;

  const draft = reducedMotion
    ? elapsedMs >= TYPE_START_MS
      ? DRAFT_TEXT
      : ""
    : typeProgress(DRAFT_TEXT, TYPE_START_MS, elapsedMs, 28);
  const typingDone = isTypingComplete(
    DRAFT_TEXT,
    TYPE_START_MS,
    elapsedMs,
    28,
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
      transition={{ duration: 0.45, ease: demoEase }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-5"
    >
      <AnimatePresence mode="wait">
        {!showChat ? (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: demoEase }}
            className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 rounded-[20px] border border-mingle-border bg-mingle-surface px-8 py-10 text-center shadow-mingle"
          >
            <MatchScoreRing
              score={DEMO_EMMA_MATCH_REPORT.overall}
              size={96}
              showLabel
            />
            <div>
              <p className="font-display text-xl font-bold text-mingle-text">
                {DEMO_DANIEL.name}
              </p>
              <p className="mt-1 text-sm text-mingle-text-secondary">
                {DEMO_ROLE.title} · {DEMO_COMPANY.name}
              </p>
            </div>
            <div
              data-demo-target="start-conversation"
              className="mingle-btn-primary"
            >
              Start a conversation
              <span className="mingle-btn-arrow" aria-hidden>
                →
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: demoEase }}
            className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"
          >
            <div
              data-demo-target="chat-thread"
              className="flex h-[min(520px,58vh)] min-h-[420px] flex-col overflow-hidden rounded-[20px] border border-mingle-border bg-mingle-surface shadow-mingle"
            >
              <div className="flex items-center gap-3 border-b border-mingle-border p-4">
                <Avatar
                  photo={DEMO_DANIEL.photo}
                  initials={DEMO_DANIEL.initials}
                  gender={DEMO_DANIEL.gender}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-bold text-mingle-text">
                    {DEMO_DANIEL.name}
                  </p>
                  <p className="truncate text-[13px] text-mingle-text-secondary">
                    {DEMO_DANIEL.headline} · {DEMO_COMPANY.name}
                  </p>
                </div>
                <span className="ml-auto hidden rounded-[10px] bg-[color:var(--mingle-light-purple)] px-3 py-1 text-[11px] font-semibold text-mingle-text sm:inline">
                  92% Match
                </span>
              </div>

              <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-4 rounded-[12px] border border-mingle-border bg-mingle-bg/80 px-3 py-2.5 text-xs text-mingle-text-secondary">
                  Product conversation scheduled — Thursday afternoon.
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
                          className={`max-w-[78%] rounded-[16px] px-4 py-2.5 text-sm ${
                            isOwn
                              ? "mingle-connection-fill text-white"
                              : "bg-[color:var(--mingle-light-blue)]/60 text-mingle-text"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              isOwn
                                ? "text-white/60"
                                : "text-mingle-text-secondary"
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
                        <div className="max-w-[78%] rounded-[16px] mingle-connection-fill px-4 py-2.5 text-sm text-white shadow-mingle">
                          <p className="whitespace-pre-wrap">{DRAFT_TEXT}</p>
                          <p className="mt-1 text-[10px] text-white/60">
                            Just now · Sent
                          </p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <div
                data-demo-target="chat-composer"
                className="border-t border-mingle-border p-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex min-h-[2.65rem] flex-1 items-center rounded-[12px] border px-4 py-2.5 text-sm transition-colors duration-300 ${
                      draft && !sent
                        ? "border-mingle-accent-blue/50 bg-mingle-white text-mingle-text"
                        : "border-mingle-border bg-mingle-bg text-mingle-text-muted"
                    }`}
                  >
                    {sent ? (
                      <span className="text-mingle-text-muted">
                        Write a message
                      </span>
                    ) : draft ? (
                      <span className="demo-typed-line">
                        {draft}
                        {showCaret ? (
                          <span className="demo-caret" aria-hidden />
                        ) : null}
                      </span>
                    ) : (
                      "Write a message"
                    )}
                  </div>
                  <div
                    data-demo-target="chat-send"
                    aria-hidden
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] transition-colors duration-300 ${
                      sent || (typingDone && !sent)
                        ? "mingle-connection-fill text-white"
                        : "bg-mingle-bg text-mingle-text-secondary"
                    }`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
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
                stage="in_conversation"
                timeline={DEMO_TIMELINE}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
