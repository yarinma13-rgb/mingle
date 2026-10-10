"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";
import { useToast } from "@/components/toast/ToastProvider";
import { applyToRoleAction } from "@/lib/careers/actions";
import type { CareerPageData, CareerPageRole } from "@/lib/careers/persistence";
import { companyInitials } from "@/lib/profile/avatar";
import { employmentLabel } from "@/lib/roles/questions";

export function CareerPageScreen({
  career,
  viewer,
  appliedRoleIds,
}: {
  career: CareerPageData;
  viewer: { id: string; userType: string } | null;
  appliedRoleIds: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [applied, setApplied] = useState(new Set(appliedRoleIds));
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApply = async (role: CareerPageRole) => {
    if (applyingId) return;

    if (!viewer) {
      router.push(`/onboarding/talent?role=${role.id}`);
      return;
    }
    if (viewer.userType !== "talent") {
      toast("Sign in with a talent account to apply.", "error");
      return;
    }

    setApplyingId(role.id);
    try {
      const result = await applyToRoleAction({ roleId: role.id });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setApplied((prev) => new Set(prev).add(role.id));
      toast("Application sent!");
    } catch {
      toast("Couldn't submit that. Try again.", "error");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Avatar
          photo={career.logo}
          initials={companyInitials(career.companyName)}
          gender={null}
          size="hero"
          shape="soft"
        />
        <div>
          <h1 className="font-display text-2xl font-bold text-mingle-text">
            {career.companyName}
          </h1>
          <p className="mt-1 text-sm text-mingle-text-secondary">
            {[career.industry, career.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        {career.mission ? (
          <p className="max-w-md text-sm leading-relaxed text-mingle-text-secondary">
            {career.mission}
          </p>
        ) : null}
      </div>

      {career.description ? (
        <p className="text-sm leading-relaxed text-mingle-text-secondary">
          {career.description}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Open roles
        </h2>
        {career.roles.length === 0 ? (
          <p className="text-sm text-mingle-text-secondary">
            No open roles right now — check back soon.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {career.roles.map((role) => {
              const hasApplied = applied.has(role.id);
              return (
                <li
                  key={role.id}
                  className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-sm font-semibold text-mingle-text">
                        {role.title}
                      </p>
                      <p className="mt-1 text-xs text-mingle-text-secondary">
                        {[role.department, employmentLabel(role.employmentType)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleApply(role)}
                      disabled={applyingId === role.id || hasApplied}
                      className="mingle-btn-primary shrink-0 text-xs disabled:opacity-60"
                    >
                      {hasApplied
                        ? "Applied"
                        : applyingId === role.id
                          ? "Applying…"
                          : "Apply"}
                    </button>
                  </div>
                  {role.workModel || role.requiredSkills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {role.workModel ? <MingleChip>{role.workModel}</MingleChip> : null}
                      {role.requiredSkills.map((skill) => (
                        <MingleChip key={skill} tone="slate">
                          {skill}
                        </MingleChip>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
