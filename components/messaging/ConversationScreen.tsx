"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessage,
  markConversationRead,
  subscribeToConversation,
  type MessageRow,
} from "@/lib/messaging/persistence";
import { isRateLimitError } from "@/lib/rate-limit";
import { EmptyState } from "@/components/EmptyState";

function SendIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.5 12 20 4.5 12.5 20l-2-6.5L4.5 12Z" />
    </svg>
  );
}

function BackArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationScreen({
  conversationId,
  viewerId,
  otherName,
  otherSubtitle,
  otherInitial,
  otherUserId,
  whyConnected,
  initialMessages,
}: {
  conversationId: string;
  viewerId: string;
  otherName: string;
  otherSubtitle: string;
  otherInitial: string;
  otherUserId: string;
  whyConnected: string;
  initialMessages: MessageRow[];
}) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markConversationRead(supabase, conversationId, viewerId).catch(() => {
      // Non critical — the unread badge will just catch up next load.
    });
  }, [supabase, conversationId, viewerId]);

  useEffect(() => {
    const unsubscribe = subscribeToConversation(supabase, conversationId, (message) => {
      setMessages((prev) =>
        prev.some((existing) => existing.id === message.id) ? prev : [...prev, message],
      );
      if (message.sender_id !== viewerId) {
        markConversationRead(supabase, conversationId, viewerId).catch(() => {});
      }
    });
    return unsubscribe;
  }, [supabase, conversationId, viewerId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const sent = await sendMessage(supabase, conversationId, viewerId, body);
      setMessages((prev) => [...prev, sent]);
      setDraft("");
    } catch (error) {
      setSendError(
        isRateLimitError(error)
          ? error.message
          : "Couldn't send that. Try again in a moment.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-14.5rem)] flex-col overflow-hidden rounded-2xl border border-mingle-border bg-mingle-surface md:h-[calc(100vh-9rem)]">
      <div className="flex items-center gap-3 border-b border-mingle-border p-4">
        <Link
          href="/conversations"
          aria-label="Back to conversations"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mingle-text-secondary transition-colors hover:text-mingle-white"
        >
          <BackArrowIcon />
        </Link>
        <Link href={`/profile/view/${otherUserId}`} className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-sm font-bold text-white">
            {otherInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-mingle-white">
              {otherName}
            </p>
            <p className="truncate text-xs text-mingle-text-secondary">{otherSubtitle}</p>
          </div>
        </Link>
        {whyConnected && (
          <p className="ml-auto hidden max-w-[40%] truncate text-xs text-mingle-text-secondary sm:block">
            {whyConnected}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            body={`Say hello to ${otherName.split(" ")[0]}. A first message is how the relationship starts.`}
          />
        ) : (
          <div className="flex flex-col gap-1">
            {messages
              .map((message) => ({ message, dayLabel: formatDayLabel(message.created_at) }))
              .map(({ message, dayLabel }, index, withLabels) => {
                const isOwn = message.sender_id === viewerId;
                const showDayLabel = index === 0 || dayLabel !== withLabels[index - 1].dayLabel;
                return (
                <div key={message.id}>
                  {showDayLabel && (
                    <p className="my-3 text-center text-[11px] font-medium uppercase tracking-wide text-mingle-text-secondary">
                      {dayLabel}
                    </p>
                  )}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isOwn
                          ? "bg-mingle-cta text-white"
                          : "bg-mingle-bg text-mingle-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isOwn ? "text-white/60" : "text-mingle-text-secondary"
                        }`}
                      >
                        {formatTime(message.created_at)}
                        {isOwn && (message.read_at ? " · Read" : " · Sent")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-mingle-border p-3">
        {sendError && (
          <p className="mb-2 text-center text-xs text-mingle-pink">{sendError}</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write a message"
            maxLength={4000}
            className="flex-1 rounded-full border border-mingle-border bg-mingle-bg px-4 py-2.5 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              draft.trim() && !sending
                ? "bg-mingle-cta text-white"
                : "cursor-not-allowed bg-mingle-bg text-mingle-text-secondary"
            }`}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
