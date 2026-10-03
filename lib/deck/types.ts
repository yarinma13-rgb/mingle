import type { ReactNode } from "react";

export type DeckSection = "main" | "appendix";

export type DeckSlideDef = {
  id: string;
  section: DeckSection;
  /** Short label for progress / appendix index. Hebrew, no hyphens. */
  label: string;
  /** Optional speaker notes for the meeting. */
  notes?: string;
  render: () => ReactNode;
};
