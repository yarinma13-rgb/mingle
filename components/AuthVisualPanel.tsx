"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const MATCHES = [
  {
    name: "Noa Levi",
    role: "Product Manager",
    where: "Tel Aviv",
    score: 96,
    why: "Same shipping pace. She already led a B2B roadmap like yours.",
    avatar: "/landing/avatars/avatar-maya.png",
    badge: "Mutual interest",
  },
  {
    name: "Jordan Hayes",
    role: "Full-stack Engineer",
    where: "Austin",
    score: 93,
    why: "Motivation lined up — he wants ownership, not ticket farms.",
    avatar: "/landing/avatars/avatar-illustrated-jordan.png",
    badge: "Strong human fit",
  },
  {
    name: "Yael Mizrahi",
    role: "Product Designer",
    where: "Tel Aviv",
    score: 91,
    why: "Clear craft overlap, and she prefers teams that talk early.",
    avatar: "/landing/avatars/avatar-illustrated-yael.png",
    badge: "Worth a conversation",
  },
] as const;

const FLOATERS = [
  {
    src: "/landing/avatars/avatar-noah.png",
    name: "Noah",
    top: "9%",
    left: "7%",
    delay: 0.1,
  },
  {
    src: "/landing/avatars/avatar-sofia.png",
    name: "Sofia",
    top: "14%",
    right: "6%",
    delay: 0.25,
  },
  {
    src: "/landing/avatars/avatar-illustrated-ava.png",
    name: "Ava",
    bottom: "11%",
    left: "8%",
    delay: 0.35,
  },
  {
    src: "/landing/avatars/avatar-arjun.png",
    name: "Arjun",
    bottom: "8%",
    right: "7%",
    delay: 0.2,
  },
] as const;

export function AuthVisualPanel() {
  return (
    <aside
      aria-hidden
      className="relative hidden min-h-screen w-full overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center"
      style={{
        background:
          "radial-gradient(70% 55% at 8% 12%, rgba(244,114,182,0.18), transparent 55%), radial-gradient(75% 60% at 92% 18%, rgba(129,140,248,0.28), transparent 52%), radial-gradient(80% 55% at 70% 90%, rgba(96,165,250,0.22), transparent 50%), linear-gradient(165deg, #f7f4ff 0%, #eef4ff 48%, #e8f0fc 100%)",
      }}
    >
      {/* soft dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.14) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ambient blobs */}
      <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-[#c4b5fd]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-28 h-64 w-64 rounded-full bg-[#93c5fd]/35 blur-3xl" />

      {/* floating people */}
      {FLOATERS.map((person) => (
        <motion.div
          key={person.name}
          className="absolute z-10 hidden xl:flex"
          style={{
            top: "top" in person ? person.top : undefined,
            bottom: "bottom" in person ? person.bottom : undefined,
            left: "left" in person ? person.left : undefined,
            right: "right" in person ? person.right : undefined,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: person.delay },
            y: {
              duration: 4.2,
              delay: person.delay,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/85 py-1.5 pl-1.5 pr-3 shadow-[0_12px_30px_rgba(79,70,229,0.12)] backdrop-blur-md">
            <span className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white">
              <Image
                src={person.src}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>
            <span className="text-xs font-semibold text-[#312e81]">{person.name}</span>
          </div>
        </motion.div>
      ))}

      <div className="relative z-20 w-full max-w-[460px] px-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 flex flex-col items-center text-center"
        >
          {/* mutual moment */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="relative h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white shadow-[0_14px_30px_rgba(99,102,241,0.25)]">
              <Image
                src="/landing/avatars/avatar-maya.png"
                alt=""
                fill
                sizes="72px"
                className="object-cover"
                priority
              />
            </div>
            <div className="relative -ml-5 h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white shadow-[0_14px_30px_rgba(99,102,241,0.25)]">
              <Image
                src="/landing/avatars/avatar-illustrated-jordan.png"
                alt=""
                fill
                sizes="72px"
                className="object-cover"
                priority
              />
            </div>
            <motion.span
              className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              Mutual
            </motion.span>
          </div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6366f1]">
            Real people. Clear why.
          </p>
          <h2 className="font-display text-[1.7rem] font-bold leading-[1.15] tracking-[-0.03em] text-[#1e1b4b]">
            Meet people worth talking to —
            <span className="bg-gradient-to-r from-[#db2777] via-[#7c3aed] to-[#2563eb] bg-clip-text text-transparent">
              {" "}
              before the first call.
            </span>
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#64748b]">
            Not another CV pile. Short lists with human reasons — Role, Human,
            and Motivation Fit.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3.5">
          {MATCHES.map((match, index) => (
            <motion.article
              key={match.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 + index * 0.08 }}
              className="rounded-[22px] border border-white/90 bg-white/95 p-3.5 shadow-[0_20px_44px_rgba(79,70,229,0.1)] backdrop-blur-sm"
              style={{ transform: `translateX(${index === 1 ? 12 : 0}px)` }}
            >
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-[#eef2ff]">
                  <Image
                    src={match.avatar}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[0.98rem] font-semibold text-[#1e1b4b]">
                        {match.name}
                      </p>
                      <p className="truncate text-xs text-[#64748b]">
                        {match.role} · {match.where}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gradient-to-r from-[#ede9fe] to-[#dbeafe] px-2.5 py-1 text-xs font-bold text-[#4f46e5]">
                      {match.score}%
                    </span>
                  </div>
                  <span className="mt-2 inline-flex rounded-full bg-[#fdf2f8] px-2 py-0.5 text-[10px] font-semibold text-[#be185d]">
                    {match.badge}
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-[#475569]">
                    {match.why}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-7 text-center text-sm font-medium text-[#64748b]"
        >
          Fewer profiles. Clearer why. Human from the first screen.
        </motion.p>
      </div>
    </aside>
  );
}
