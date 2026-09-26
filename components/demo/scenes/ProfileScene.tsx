"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";
import { DEMO_DANIEL } from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

function Layer({
  show,
  children,
  className = "",
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: show ? 1 : 0.22,
        y: show ? 0 : 6,
        filter: show ? "blur(0px)" : "blur(0.2px)",
      }}
      transition={{ duration: 0.55, ease: demoEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scene 03 — progressive reveal of the person beyond the CV.
 */
export function ProfileScene() {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const t = (ms: number) => reducedMotion || elapsedMs >= ms;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: demoEase }}
      className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"
    >
      <aside className="rounded-[20px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
        <p className="mingle-gradient-text text-center text-[11px] font-semibold uppercase tracking-[0.16em]">
          Talent profile
        </p>
        <div
          data-demo-target="profile-avatar"
          className="mt-4 flex flex-col items-center gap-3 text-center"
        >
          <Avatar
            photo={DEMO_DANIEL.photo}
            initials={DEMO_DANIEL.initials}
            gender={DEMO_DANIEL.gender}
            size="hero"
          />
          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-mingle-text">
              {DEMO_DANIEL.name}
            </h2>
            <p className="mt-1 text-[15px] font-medium text-mingle-text">
              {DEMO_DANIEL.headline}
            </p>
            <p className="mt-1 text-[13px] text-mingle-text-secondary">
              {DEMO_DANIEL.location}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex flex-col gap-3">
        <Layer show={t(300)}>
          <section className="rounded-[18px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Experience
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mingle-text">
              {DEMO_DANIEL.experience}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mingle-text-secondary">
              {DEMO_DANIEL.about}
            </p>
          </section>
        </Layer>

        <Layer show={t(1000)}>
          <section className="rounded-[18px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Skills
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_DANIEL.skills.map((skill) => (
                <MingleChip key={skill}>{skill}</MingleChip>
              ))}
            </div>
          </section>
        </Layer>

        <Layer show={t(2000)}>
          <section
            data-demo-target="profile-goals"
            className="rounded-[18px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Goals
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_DANIEL.goals.map((goal) => (
                <MingleChip key={goal} tone="pink">
                  {goal}
                </MingleChip>
              ))}
            </div>
          </section>
        </Layer>

        <Layer show={t(3200)}>
          <section
            data-demo-target="profile-work"
            className="rounded-[18px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Work preferences
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_DANIEL.workStyle.map((item) => (
                <MingleChip key={item} tone="blue">
                  {item}
                </MingleChip>
              ))}
            </div>
            <p className="mt-3 text-sm text-mingle-text-secondary">
              Salary expectations · {DEMO_DANIEL.salary}
            </p>
            <p className="mt-1 text-sm text-mingle-text-secondary">
              Location · {DEMO_DANIEL.location}
            </p>
          </section>
        </Layer>

        <Layer show={t(4300)}>
          <section
            data-demo-target="profile-motivation"
            className="rounded-[18px] border border-mingle-border bg-gradient-to-br from-[color:var(--mingle-light-pink)] via-[color:var(--mingle-light-purple)] to-[color:var(--mingle-light-blue)] p-5 shadow-mingle"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Motivation
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-mingle-text">
              {DEMO_DANIEL.motivation}
            </p>
          </section>
        </Layer>
      </div>
    </motion.div>
  );
}
