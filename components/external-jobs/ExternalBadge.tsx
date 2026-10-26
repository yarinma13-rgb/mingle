import { EXTERNAL_OPPORTUNITY_LABEL } from "@/lib/external-jobs/types";

export function ExternalBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-mingle-border bg-mingle-bg px-2 py-0.5 text-[11px] font-semibold text-mingle-text-secondary">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 4h6v6" />
        <path d="M20 4 10 14" />
        <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </svg>
      {EXTERNAL_OPPORTUNITY_LABEL}
    </span>
  );
}

export function OnMingleBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-mingle-accent-purple/12 px-2 py-0.5 text-[11px] font-semibold text-mingle-accent-purple">
      Hiring on mingle
    </span>
  );
}
