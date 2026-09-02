import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { IconBadge } from "@/components/dashboard/IconBadge";
import { FunnelIcon } from "@/components/dashboard/icons";
import {
  FUNNEL_STAGES,
  type CompanyFunnel,
} from "@/lib/dashboard/funnel";

export function CompanyPipelineFunnel({ funnel }: { funnel: CompanyFunnel }) {
  const max = Math.max(1, ...FUNNEL_STAGES.map((stage) => funnel.counts[stage.id]));

  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
      <div className="flex items-center gap-3">
        <IconBadge icon={FunnelIcon} accent="purpleCta" size={32} iconSize={15} />
        <h2 className="font-display text-sm font-semibold text-mingle-white">
          Your pipeline
        </h2>
        <Link
          href="/board"
          className="ml-auto text-xs font-medium text-mingle-cta"
        >
          Open board
        </Link>
      </div>

      {funnel.total === 0 ? (
        <EmptyState
          title="No connections in your pipeline yet"
          body="When you and talent both want to talk, each relationship shows up here by stage. Same picture as the board, just at a glance."
          actionHref="/discover"
          actionLabel="Find people"
        />
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3">
            {FUNNEL_STAGES.map((stage) => {
              const count = funnel.counts[stage.id];
              const width = Math.round((count / max) * 100);
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-mingle-text-secondary">
                    {stage.label}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-mingle-bg">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-mingle-pink to-mingle-purple"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-medium text-mingle-white">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-mingle-text-secondary">
            {funnel.total} {funnel.total === 1 ? "connection" : "connections"}{" "}
            across stages. Counts follow the latest stage on the board.
          </p>
        </>
      )}
    </div>
  );
}
