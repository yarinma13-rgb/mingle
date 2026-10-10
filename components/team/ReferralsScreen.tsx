"use client";

import { useState } from "react";
import { MingleChip } from "@/components/MingleChip";
import { useToast } from "@/components/toast/ToastProvider";
import {
  createReferralLinkAction,
  markReferralStatusAction,
} from "@/lib/referrals/actions";
import type { RoleReferralRow } from "@/lib/referrals/persistence";

export type ReferralRoleOption = { id: string; title: string };

export function ReferralsScreen({
  roles,
  initialReferrals,
  currentUserId,
  companyId,
  canManage,
  origin,
}: {
  roles: ReferralRoleOption[];
  initialReferrals: RoleReferralRow[];
  currentUserId: string;
  companyId: string;
  canManage: boolean;
  origin: string;
}) {
  const toast = useToast();
  const [referrals, setReferrals] = useState(initialReferrals);
  const [sharingRoleId, setSharingRoleId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const roleTitleById = new Map(roles.map((role) => [role.id, role.title]));

  const handleShare = async (roleId: string) => {
    if (sharingRoleId) return;
    setSharingRoleId(roleId);
    try {
      const result = await createReferralLinkAction({ roleId, companyId });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      const link = `${origin}/welcome?ref=${result.id}`;
      await navigator.clipboard.writeText(link);
      toast("Referral link copied!");
      setReferrals((prev) => {
        if (prev.some((row) => row.id === result.id)) return prev;
        return [
          {
            id: result.id,
            roleId,
            referrerUserId: currentUserId,
            referredUserId: null,
            status: "pending",
            createdAt: new Date().toISOString(),
            paidAt: null,
          },
          ...prev,
        ];
      });
    } catch {
      toast("Couldn't create that link. Try again.", "error");
    } finally {
      setSharingRoleId(null);
    }
  };

  const handleMarkPaid = async (referralId: string) => {
    if (updatingId) return;
    setUpdatingId(referralId);
    try {
      const result = await markReferralStatusAction({
        referralId,
        companyId,
        status: "paid",
      });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setReferrals((prev) =>
        prev.map((row) =>
          row.id === referralId
            ? { ...row, status: "paid", paidAt: new Date().toISOString() }
            : row,
        ),
      );
    } catch {
      toast("Couldn't save that. Try again.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <p className="text-sm leading-relaxed text-mingle-text-secondary">
        Share an open role with people you know. When someone you referred
        joins mingle through your link, it shows up below.
      </p>

      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Open roles
        </h2>
        {roles.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            No open roles right now.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {roles.map((role) => (
              <li
                key={role.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-mingle-border bg-mingle-bg px-4 py-3"
              >
                <span className="text-sm font-medium text-mingle-text">
                  {role.title}
                </span>
                <button
                  type="button"
                  onClick={() => void handleShare(role.id)}
                  disabled={sharingRoleId === role.id}
                  className="mingle-btn-primary shrink-0 text-xs disabled:opacity-60"
                >
                  {sharingRoleId === role.id ? "Creating…" : "Share & earn"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Your referrals
        </h2>
        {referrals.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            No referrals yet — share a role above to get started.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {referrals.map((referral) => (
              <li
                key={referral.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-mingle-border bg-mingle-bg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-mingle-text">
                    {roleTitleById.get(referral.roleId) ?? "Role"}
                  </p>
                  <p className="text-xs text-mingle-text-secondary">
                    {referral.referredUserId
                      ? "Someone joined through this link"
                      : "Waiting for someone to join"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <MingleChip tone={referral.status === "paid" ? "green" : "amber"}>
                    {referral.status === "paid" ? "Paid" : "Pending"}
                  </MingleChip>
                  {canManage && referral.status === "pending" && referral.referredUserId ? (
                    <button
                      type="button"
                      onClick={() => void handleMarkPaid(referral.id)}
                      disabled={updatingId === referral.id}
                      className="rounded-full border border-mingle-border bg-mingle-white px-3 py-1.5 text-[11px] font-semibold text-mingle-text-secondary transition-colors hover:border-mingle-cta hover:text-mingle-text disabled:opacity-60"
                    >
                      {updatingId === referral.id ? "Saving…" : "Mark as paid"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
