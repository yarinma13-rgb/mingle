"use client";

import { motion } from "framer-motion";
import { MingleChip } from "@/components/MingleChip";
import { DEMO_COMPANY, DEMO_ROLE } from "@/lib/demo/data";

/** Company role definition — full opacity product surface. */
export function RoleScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-3xl"
    >
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6 shadow-mingle sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-muted">
          Open role · {DEMO_COMPANY.name}
        </p>
        <h2
          data-demo-target="role-title"
          className="mt-2 font-display text-2xl font-semibold tracking-tight text-mingle-text"
        >
          {DEMO_ROLE.title}
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          {DEMO_ROLE.department} · {DEMO_ROLE.seniority} · {DEMO_ROLE.employment}
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          {DEMO_ROLE.summary}
        </p>

        <div data-demo-target="role-skills" className="mt-6">
          <p className="text-xs font-semibold text-mingle-text">Skills that matter</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ROLE.requiredSkills.map((skill) => (
              <MingleChip key={skill}>{skill}</MingleChip>
            ))}
          </div>
        </div>

        <div data-demo-target="role-beyond" className="mt-5">
          <p className="text-xs font-semibold text-mingle-text">
            What matters beyond the CV
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {DEMO_ROLE.whatMatters.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-mingle-text-secondary"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-accent-purple"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {DEMO_ROLE.workModel.map((model) => (
            <MingleChip key={model} tone="pink">
              {model}
            </MingleChip>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
