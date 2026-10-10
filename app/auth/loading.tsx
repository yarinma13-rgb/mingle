export default function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-1">
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:w-[48%] lg:px-16">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 h-11 w-11 animate-pulse rounded-xl bg-mingle-lavender" />
          <div className="h-4 w-28 animate-pulse rounded bg-mingle-border/50" />
          <div className="mt-3 h-9 w-64 max-w-full animate-pulse rounded-lg bg-mingle-lavender" />
          <div className="mt-8 h-11 w-full animate-pulse rounded-xl bg-mingle-border/40" />
          <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-mingle-border/40" />
          <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-mingle-lavender" />
        </div>
      </div>
      <div className="hidden flex-1 animate-pulse bg-mingle-lavender/60 lg:block" />
    </div>
  );
}
