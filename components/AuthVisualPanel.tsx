/** Right-side product mock for the auth split layout. Desktop only. */

const FIT_ROWS = [
  { label: "Role Fit", score: 92, tone: "from-mingle-pink to-mingle-accent-magenta" },
  { label: "Human Fit", score: 88, tone: "from-mingle-purple to-mingle-accent-violet" },
  { label: "Motivation Fit", score: 85, tone: "from-mingle-blue to-mingle-accent-blue" },
] as const;

const FLOATING = [
  { name: "Noa", initial: "N", top: "12%", left: "8%", tone: "bg-mingle-accent-pink" },
  { name: "Eli", initial: "E", top: "22%", right: "10%", tone: "bg-mingle-accent-blue" },
  { name: "Maya", initial: "M", bottom: "18%", left: "12%", tone: "bg-mingle-accent-purple" },
  { name: "Tom", initial: "T", bottom: "14%", right: "8%", tone: "bg-mingle-accent-magenta" },
] as const;

export function AuthVisualPanel() {
  return (
    <aside
      aria-hidden
      className="relative hidden min-h-screen overflow-hidden lg:flex lg:items-center lg:justify-center"
      style={{
        background:
          "radial-gradient(120% 90% at 20% 10%, rgba(234,30,99,0.35), transparent 55%), radial-gradient(90% 80% at 90% 80%, rgba(62,107,224,0.4), transparent 50%), linear-gradient(165deg, #1a1433 0%, #2a1f55 42%, #152048 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {FLOATING.map((chip) => (
        <div
          key={chip.name}
          className="absolute z-10 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 shadow-lg backdrop-blur-md"
          style={{
            top: "top" in chip ? chip.top : undefined,
            bottom: "bottom" in chip ? chip.bottom : undefined,
            left: "left" in chip ? chip.left : undefined,
            right: "right" in chip ? chip.right : undefined,
          }}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full font-display text-xs font-bold text-white ${chip.tone}`}
          >
            {chip.initial}
          </span>
          <span className="pr-1 text-xs font-semibold text-white/90">{chip.name}</span>
        </div>
      ))}

      <div className="relative z-20 w-full max-w-md px-10">
        <p className="mb-4 text-center font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
          Why this match
        </p>

        <div className="rounded-[22px] border border-white/12 bg-white/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-mingle-text">
                Product Designer
              </p>
              <p className="mt-1 text-sm text-mingle-text-secondary">
                Tel Aviv · Hybrid · Series B
              </p>
            </div>
            <span className="rounded-full bg-gradient-to-r from-mingle-pink via-mingle-purple to-mingle-blue px-3 py-1 font-display text-xs font-bold text-white">
              91% match
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {FIT_ROWS.map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-mingle-text">{row.label}</span>
                  <span className="font-semibold text-mingle-text-secondary">
                    {row.score}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mingle-lavender">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${row.tone}`}
                    style={{ width: `${row.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 rounded-xl bg-mingle-lavender/80 px-3.5 py-3 text-xs leading-relaxed text-mingle-text-secondary">
            Strong craft overlap, shared pace, and motivation that lines up with
            how this team ships.
          </p>
        </div>

        <p className="mt-8 text-center font-display text-sm font-medium text-white/70">
          Fewer profiles. Clearer why.
        </p>
      </div>
    </aside>
  );
}
