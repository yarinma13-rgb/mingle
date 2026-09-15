"use client";

import { motion } from "framer-motion";
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Conversation + relationship context using the same visual language as
 * ConversationScreen / RelationshipContextPanel — local state only.
 */
export function ConversationScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
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

        <div className="flex-1 overflow-y-auto px-4 py-4">
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
          </div>
        </div>

        <div data-demo-target="chat-composer" className="border-t border-mingle-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full border border-mingle-border bg-mingle-bg px-4 py-2.5 text-sm text-mingle-text-muted">
              Write a message
            </div>
            <div
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mingle-bg text-mingle-text-secondary"
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
