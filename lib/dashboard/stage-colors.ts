import type { RelationshipStage } from "@/lib/supabase/types";
import { FUNNEL_STAGES } from "@/lib/dashboard/funnel";

/** Same stage palette as CompanyPipelineDonut / Board columns. */
export const STAGE_COLORS: Record<RelationshipStage, string> = {
  connected: "var(--mingle-accent-pink)",
  exploring: "var(--mingle-accent-purple)",
  in_conversation: "var(--mingle-accent-blue)",
  opportunity: "var(--mingle-warning)",
  decision: "var(--mingle-success)",
  relationship: "var(--mingle-purple)",
};

export const STAGE_BAR_SEGMENTS = FUNNEL_STAGES.map((stage) => ({
  id: stage.id,
  label: stage.label,
  color: STAGE_COLORS[stage.id],
}));
