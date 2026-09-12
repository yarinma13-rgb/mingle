/** Right-side product story for the auth split. Desktop only. */

const MATCHES = [
  {
    name: "Noa Levi",
    role: "Product Manager",
    where: "Tel Aviv",
    score: 96,
    why: "Role + culture lined up",
    tone: "from-[#a78bfa] to-[#6366f1]",
  },
  {
    name: "Jordan Hayes",
    role: "Full-stack",
    where: "Austin",
    score: 93,
    why: "Motivation match is strong",
    tone: "from-[#60a5fa] to-[#818cf8]",
  },
  {
    name: "Yael Mizrahi",
    role: "Product Designer",
    where: "Tel Aviv",
    score: 91,
    why: "Clear human fit signal",
    tone: "from-[#c084fc] to-[#3b82f6]",
  },
] as const;

export function AuthVisualPanel() {
  return (
    <aside
      aria-hidden
      className="relative hidden min-h-screen w-full overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center"
      style={{
        background:
          "radial-gradient(90% 70% at 12% 18%, rgba(139,92,246,0.16), transparent 55%), radial-gradient(80% 60% at 88% 82%, rgba(96,165,250,0.22), transparent 50%), linear-gradient(165deg, #f5f7ff 0%, #eef2ff 45%, #e8eefc 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.12) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] px-10">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6366f1]">
          Mutual matches
        </p>
        <h2 className="mb-8 text-center font-display text-[1.65rem] font-bold leading-tight tracking-[-0.03em] text-[#1e1b4b]">
          People worth talking to,
          <br />
          with reasons you can trust.
        </h2>

        <div className="flex flex-col gap-3">
          {MATCHES.map((match, index) => (
            <div
              key={match.name}
              className="rounded-[20px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(79,70,229,0.08)] backdrop-blur-sm"
              style={{ transform: `translateX(${index === 1 ? 10 : 0}px)` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${match.tone} font-display text-sm font-bold text-white`}
                >
                  {match.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.95rem] font-semibold text-[#1e1b4b]">
                    {match.name}
                  </p>
                  <p className="truncate text-xs text-[#64748b]">
                    {match.role} · {match.where}
                  </p>
                </div>
                <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#4f46e5]">
                  {match.score}%
                </span>
              </div>
              <p className="mt-3 rounded-xl bg-[#f8fafc] px-3 py-2 text-xs leading-relaxed text-[#475569]">
                {match.why}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-medium text-[#64748b]">
          Fewer profiles. Clearer why. Mutual interest first.
        </p>
      </div>
    </aside>
  );
}
