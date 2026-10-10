"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { DEMO_BOARD_COLUMNS, DEMO_EMMA, DEMO_DANIEL } from "@/lib/demo/data";

const AVATAR_BY_NAME: Record<
  string,
  { initials: string; photo: string | null; gender: "female" | "male" | null }
> = {
  "Emma Carter": {
    initials: DEMO_EMMA.initials,
    photo: DEMO_EMMA.photo,
    gender: DEMO_EMMA.gender,
  },
  "Daniel Morgan": {
    initials: DEMO_DANIEL.initials,
    photo: DEMO_DANIEL.photo,
    gender: DEMO_DANIEL.gender,
  },
  "Sofia Reyes": {
    initials: "SR",
    photo: "/landing/avatars/avatar-maya.png",
    gender: "female",
  },
};

/**
 * Static hiring board — same column language as CompanyBoardScreen,
 * read-only for recording (no drag mutations).
 */
export function BoardScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-mingle-text-secondary">
        Relationship stages in one view — from first connection through
        conversation and interview.
      </p>

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex min-w-max gap-3 pb-2">
          {DEMO_BOARD_COLUMNS.map((column) => (
            <section
              key={column.id}
              data-demo-target={
                column.id === "in_conversation"
                  ? "board-conversation"
                  : column.id === "interview_booked"
                    ? "board-interview"
                    : undefined
              }
              className="flex w-56 shrink-0 flex-col rounded-2xl border border-mingle-border bg-mingle-surface p-3 shadow-mingle"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: column.accent }}
                />
                <h3 className="font-display text-xs font-semibold text-mingle-text">
                  {column.label}
                </h3>
                <span className="ml-auto text-[10px] text-mingle-text-muted">
                  {column.names.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {column.names.map((name) => {
                  const avatar = AVATAR_BY_NAME[name];
                  return (
                    <li
                      key={`${column.id}-${name}`}
                      className="flex items-center gap-2.5 rounded-xl border border-mingle-border/80 bg-mingle-bg/50 px-2.5 py-2"
                    >
                      <Avatar
                        photo={avatar?.photo ?? null}
                        initials={avatar?.initials ?? "?"}
                        gender={avatar?.gender ?? null}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-mingle-text">
                          {name}
                        </p>
                        <p className="truncate text-[10px] text-mingle-text-secondary">
                          Product design
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
