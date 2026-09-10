"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { RoleBuilder } from "@/components/roles/RoleBuilder";
import { useToast } from "@/components/toast/ToastProvider";
import {
  employmentLabel,
  ROLE_STATUS_OPTIONS,
  statusLabel,
} from "@/lib/roles/questions";
import {
  draftFromRole,
  EMPTY_ROLE_DRAFT,
  isMissingRolesTable,
  updateCompanyRoleStatus,
  type RoleRecord,
} from "@/lib/roles/persistence";
import type { RoleStatus } from "@/lib/supabase/types";

type FilterId = "all" | RoleStatus;

export function RolesScreen({
  companyId,
  initialRoles,
  tableMissing,
  startInBuilder = false,
}: {
  companyId: string;
  initialRoles: RoleRecord[];
  tableMissing: boolean;
  startInBuilder?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [roles, setRoles] = useState(initialRoles);
  const [filter, setFilter] = useState<FilterId>("all");
  const [mode, setMode] = useState<"list" | "builder">(
    startInBuilder ? "builder" : "list",
  );
  const [editing, setEditing] = useState<RoleRecord | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? roles : roles.filter((role) => role.status === filter)),
    [filter, roles],
  );

  function openCreate() {
    setEditing(null);
    setMode("builder");
  }

  function openEdit(role: RoleRecord) {
    setEditing(role);
    setMode("builder");
  }

  async function setStatus(role: RoleRecord, status: RoleStatus) {
    if (role.status === status) return;
    try {
      const updated = await updateCompanyRoleStatus(
        supabase,
        role.id,
        companyId,
        status,
      );
      setRoles((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast(`${updated.title} is now ${statusLabel(status).toLowerCase()}`);
      router.refresh();
    } catch (caught) {
      const missing = isMissingRolesTable(
        caught && typeof caught === "object" ? (caught as { message?: string; code?: string }) : null,
      );
      toast(
        missing
          ? "Run the roles migration in Supabase first"
          : "Could not update status",
        "error",
      );
    }
  }

  if (mode === "builder") {
    return (
      <RoleBuilder
        key={editing?.id ?? "new"}
        supabase={supabase}
        companyId={companyId}
        initialDraft={editing ? draftFromRole(editing) : EMPTY_ROLE_DRAFT}
        editingId={editing?.id ?? null}
        onCancel={() => setMode("list")}
        onSaved={(saved) => {
          setRoles((prev) => {
            const exists = prev.some((item) => item.id === saved.id);
            return exists
              ? prev.map((item) => (item.id === saved.id ? saved : item))
              : [saved, ...prev];
          });
          setMode("list");
          toast(editing ? "Role updated" : "Role created");
          router.refresh();
        }}
      />
    );
  }

  if (tableMissing) {
    return (
      <EmptyState
        title="Roles are not live in the database yet"
        body="Run supabase/migrations/0014_company_roles.sql in the Supabase SQL Editor, then refresh this page."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          Open roles your team is hiring for. Candidates will not see these
          until you choose to share them.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openCreate} className="mingle-btn-primary text-xs">
            Create role
          </button>
          <Link href="/roles/paste" className="mingle-btn-secondary text-xs">
            Paste a job description instead
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([{ value: "all", label: "All" }, ...ROLE_STATUS_OPTIONS] as const).map(
          (option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium ${
                filter === option.value
                  ? "border-mingle-blue bg-mingle-lavender text-mingle-text"
                  : "border-mingle-surface bg-mingle-surface text-mingle-text-secondary"
              }`}
            >
              {option.label}
            </button>
          ),
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={roles.length === 0 ? "No roles yet" : "Nothing in this view"}
          body={
            roles.length === 0
              ? "Create a role in a few taps. Most fields are choices, not typing."
              : "Try another status, or create a new role."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((role) => (
            <article
              key={role.id}
              className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/roles/${role.id}`}
                    className="font-display text-base font-semibold tracking-tight text-mingle-text hover:underline"
                  >
                    {role.title}
                  </Link>
                  <p className="mt-1 text-xs text-mingle-text-secondary">
                    {[role.department, role.seniority, employmentLabel(role.employmentType)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <MingleChip tone={role.status === "open" ? "pink" : "purple"}>
                  {statusLabel(role.status)}
                </MingleChip>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.workModel ? <MingleChip>{role.workModel}</MingleChip> : null}
                {role.requiredSkills.slice(0, 3).map((skill) => (
                  <MingleChip key={skill}>{skill}</MingleChip>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                <Link
                  href={`/roles/${role.id}/matches`}
                  className="mingle-btn-primary text-xs"
                >
                  View matches
                </Link>
                <button
                  type="button"
                  onClick={() => openEdit(role)}
                  className="mingle-btn-secondary text-xs"
                >
                  Edit
                </button>
                {ROLE_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={role.status === option.value}
                    onClick={() => void setStatus(role, option.value)}
                    className="rounded-full px-3 py-2 text-xs font-medium text-mingle-text-secondary hover:bg-mingle-surface disabled:text-mingle-text"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
