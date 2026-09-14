/**
 * Content-only skeleton for routes under the persistent (app) shell layout.
 * Do not redraw the sidebar/header — those stay mounted during navigations.
 */
export function DashboardRouteLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-mingle-lavender" />
      <div className="h-40 animate-pulse rounded-2xl bg-mingle-white/80" />
      <div className="h-56 animate-pulse rounded-2xl bg-mingle-white/80" />
    </div>
  );
}
