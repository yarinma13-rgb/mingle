export default function DiscoverLoading() {
  return (
    <div className="flex flex-col gap-6 px-1 py-2">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-mingle-border/50" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-mingle-border/40" />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-mingle-border bg-mingle-white shadow-mingle">
          <div className="aspect-[3/4] max-h-[min(58vh,480px)] w-full animate-pulse bg-mingle-lavender" />
          <div className="flex flex-col items-center gap-3 px-5 py-6">
            <div className="h-3 w-36 animate-pulse rounded-full bg-mingle-border/50" />
            <p className="text-xs font-medium text-mingle-text-secondary">
              Still matching people for you…
            </p>
            <div className="mt-2 flex gap-8">
              <div className="h-16 w-16 animate-pulse rounded-full bg-mingle-border/40" />
              <div className="h-16 w-16 animate-pulse rounded-full bg-mingle-border/40" />
            </div>
          </div>
        </div>
        <div className="hidden min-h-[420px] flex-col gap-4 rounded-3xl border border-mingle-border bg-mingle-surface-elevated p-5 lg:flex">
          <div className="h-3 w-24 animate-pulse rounded-full bg-mingle-border/50" />
          <div className="h-20 w-20 animate-pulse rounded-full bg-mingle-border/40" />
          <div className="h-3 w-full animate-pulse rounded-full bg-mingle-border/40" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-mingle-border/30" />
          <div className="h-3 w-4/6 animate-pulse rounded-full bg-mingle-border/30" />
          <p className="mt-auto text-xs text-mingle-text-secondary">
            Still waiting for the match report…
          </p>
        </div>
      </div>
    </div>
  );
}
