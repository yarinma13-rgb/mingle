"use client";

export function DashboardRouteLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <div className="h-[4.75rem] border-b border-mingle-border/70 bg-mingle-white/75" />
      <div className="flex flex-1">
        <div className="hidden w-[5.75rem] shrink-0 md:block" />
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-5 pt-8 sm:px-10">
          <div className="h-9 w-48 rounded-lg bg-mingle-lavender" />
          <div className="h-40 rounded-2xl bg-mingle-white/80" />
          <div className="h-56 rounded-2xl bg-mingle-white/80" />
        </div>
      </div>
    </div>
  );
}
