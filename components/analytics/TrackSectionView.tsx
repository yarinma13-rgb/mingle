"use client";

import { useEffect, useRef } from "react";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Fires `landing_section_viewed` the first time a section enters the viewport.
 * Used to learn which landing blocks people actually reach.
 */
export function TrackSectionView({
  section,
  children,
  className,
  id,
}: {
  section: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || sent.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((entry) => entry.isIntersecting);
        if (!hit || sent.current) return;
        sent.current = true;
        track(AnalyticsEvent.landingSectionViewed, { section });
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [section]);

  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
}
