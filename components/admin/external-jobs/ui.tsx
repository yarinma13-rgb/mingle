import { SubmitButton } from "@/components/admin/external-jobs/SubmitButton";
import type { ExternalJobStatus } from "@/lib/supabase/types";

export const inputClass =
  "rounded-lg border border-mingle-border bg-mingle-bg px-2 py-1.5 text-sm text-mingle-text";

const STATUS_TONE: Record<string, string> = {
  published: "bg-mingle-success/15 text-mingle-success",
  active: "bg-mingle-success/15 text-mingle-success",
  completed: "bg-mingle-success/15 text-mingle-success",
  pending_review: "bg-mingle-warning/20 text-mingle-text",
  needs_review: "bg-mingle-warning/20 text-mingle-text",
  pending_verification: "bg-mingle-warning/20 text-mingle-text",
  paused: "bg-mingle-warning/20 text-mingle-text",
  discovered: "bg-mingle-accent-blue/12 text-mingle-accent-blue",
  rejected: "bg-mingle-error/12 text-mingle-error",
  removed: "bg-mingle-error/12 text-mingle-error",
  expired: "bg-mingle-border text-mingle-text-secondary",
};

export function StatusPill({ status }: { status: ExternalJobStatus | string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        STATUS_TONE[status] ?? "bg-mingle-border text-mingle-text-secondary"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Panel({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-mingle-text">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function when(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActionButton({
  action,
  fields,
  label,
  tone = "secondary",
  pendingLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  tone?: "primary" | "secondary" | "danger";
  pendingLabel?: string;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton
        pendingLabel={pendingLabel}
        className={
          tone === "primary"
            ? "mingle-btn-primary text-xs"
            : tone === "danger"
              ? "rounded-full border border-mingle-error/40 px-3 py-1 text-xs font-semibold text-mingle-error hover:bg-mingle-error/10"
              : "mingle-btn-secondary text-xs"
        }
      >
        {label}
      </SubmitButton>
    </form>
  );
}
