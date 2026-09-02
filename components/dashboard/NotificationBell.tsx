"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadNotificationSummary, type NotificationItem } from "@/lib/notifications/persistence";
import { BellIcon, MessageIcon, PeopleIcon } from "@/components/dashboard/icons";

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function itemHref(item: NotificationItem): string {
  return item.kind === "message" ? `/conversations/${item.connectionId}` : "/connections";
}

function itemText(item: NotificationItem): string {
  return item.kind === "message"
    ? `${item.name}: ${item.preview}`
    : `${item.name} wants to connect`;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    loadNotificationSummary(supabase, userId)
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleOpen = () => {
    if (!open) refresh();
    setOpen((prev) => !prev);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-mingle-border bg-mingle-surface text-mingle-text-secondary transition-colors hover:text-mingle-white"
      >
        <BellIcon size={16} />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-mingle-pink px-1 text-[10px] font-semibold text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div
          data-theme="light"
          className="absolute right-0 top-11 z-50 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-mingle-border bg-mingle-surface shadow-xl"
        >
          <div className="border-b border-mingle-border px-4 py-3">
            <p className="font-display text-sm font-semibold text-mingle-white">
              Notifications
            </p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-mingle-text-secondary">
              You&rsquo;re all caught up.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map((item) => {
                const Icon = item.kind === "message" ? MessageIcon : PeopleIcon;
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={itemHref(item)}
                    onClick={() => {
                      // Deferred rather than closing synchronously in
                      // the same click that triggers navigation, so
                      // there's no chance of the dropdown (and this
                      // link) unmounting before Next's router has
                      // dispatched the transition — matters most when
                      // the target is the page already open, where
                      // there's no full remount to close it for free.
                      setTimeout(() => setOpen(false), 0);
                    }}
                    className="flex w-full cursor-pointer items-start gap-3 border-b border-mingle-border px-4 py-3 text-left last:border-0 hover:bg-mingle-bg"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mingle-purple/15 text-mingle-purple">
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-mingle-white">
                        {itemText(item)}
                      </span>
                      <span className="text-xs text-mingle-text-secondary">
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
