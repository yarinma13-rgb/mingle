"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { respondToCompanyInterest } from "@/lib/talent-exchange/persistence";
import { MatchReportBody } from "@/components/matching/MatchReport";
import type { MatchReport } from "@/lib/matching/report";
import { useToast } from "@/components/toast/ToastProvider";

export function TalentExchangeResponse({
  matchId,
  candidateId,
  companyId,
  companyName,
  roleTitle,
  report,
  alreadyResponded,
  status,
}: {
  matchId: string;
  candidateId: string;
  companyId: string;
  companyName: string;
  roleTitle: string | null;
  report: MatchReport | null;
  alreadyResponded: boolean;
  status: "pending" | "mutual" | "candidate_declined";
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState<"mutual" | "declined" | null>(
    status === "mutual" ? "mutual" : status === "candidate_declined" ? "declined" : null,
  );

  async function respond(interested: boolean) {
    if (busy || resolved) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const result = await respondToCompanyInterest(
        supabase,
        matchId,
        candidateId,
        companyId,
        interested,
      );
      if (result.outcome === "mutual") {
        setResolved("mutual");
        toast("You both expressed interest — it's a mingle!");
        router.refresh();
      } else if (result.outcome === "declined") {
        setResolved("declined");
      }
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle">
        <p className="font-display text-lg font-semibold text-mingle-text">
          {roleTitle ? `${roleTitle} — ${companyName}` : companyName}
        </p>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          A company found your profile a potential match and is interested.
        </p>
      </div>

      {report ? <MatchReportBody report={report} /> : null}

      {resolved === "mutual" ? (
        <div className="rounded-2xl border border-mingle-success/30 bg-mingle-success/10 p-5 text-sm text-mingle-text">
          You both expressed interest. The company can now see the information
          you&apos;ve chosen to share — check your Connections to start the
          conversation.
        </div>
      ) : resolved === "declined" || alreadyResponded ? (
        <div className="rounded-2xl border border-mingle-border bg-mingle-white p-5 text-sm text-mingle-text-secondary">
          You already responded to this one.
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void respond(true)}
            className="mingle-btn-primary flex-1 disabled:opacity-60"
          >
            Interested
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void respond(false)}
            className="mingle-btn-secondary flex-1 disabled:opacity-60"
          >
            Not Interested
          </button>
        </div>
      )}
    </div>
  );
}
