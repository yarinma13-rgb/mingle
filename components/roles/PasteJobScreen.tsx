"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoleBuilder } from "@/components/roles/RoleBuilder";
import { useToast } from "@/components/toast/ToastProvider";
import {
  createCompanyRole,
  isMissingRolesTable,
  type RoleDraft,
} from "@/lib/roles/persistence";
import {
  extractRoleFromJd,
  looksLikeUrl,
  roleExtractNeedsBuilder,
} from "@/lib/roles/extract-jd";
import { importJdFromUrlAction } from "@/lib/roles/import-jd-action";

type PasteMode = "text" | "url" | "manual";

const STEPS = [
  "Reading the job description",
  "Extracting requirements",
  "Finding candidates",
] as const;

const URL_HINT =
  "Supports AllJobs, Drushim, and JobMaster links. LinkedIn is not supported.";

function JobProcessing({ doneCount }: { doneCount: number }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-6 text-center">
      <p className="font-display text-lg font-semibold text-mingle-text">
        Finding your matches
      </p>
      <ul className="flex w-full flex-col gap-3 text-left">
        {STEPS.map((label, index) => {
          const done = index < doneCount;
          return (
            <li
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-mingle-border bg-mingle-surface px-4 py-3"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  done ? "bg-mingle-success" : "bg-mingle-text-secondary/30"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className="text-sm text-mingle-text">{label}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-mingle-text-secondary">
        Heuristic read only. No model is running on this JD yet.
      </p>
    </div>
  );
}

export function PasteJobScreen({ companyId }: { companyId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<PasteMode>("text");
  const [value, setValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [builderDraft, setBuilderDraft] = useState<RoleDraft | null>(null);

  const ready =
    mode === "text"
      ? value.trim().length > 40
      : mode === "url"
        ? looksLikeUrl(value)
        : false;

  async function runProcessing(draft: RoleDraft) {
    setProcessing(true);
    setDoneCount(0);
    for (let i = 1; i <= STEPS.length; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setDoneCount(i);
    }
    if (roleExtractNeedsBuilder(draft)) {
      setProcessing(false);
      setBuilderDraft(draft);
      toast("Some fields need a tap in the builder.");
      return;
    }
    try {
      const saved = await createCompanyRole(supabase, companyId, draft);
      router.push(`/roles/${saved.id}/matches`);
      router.refresh();
    } catch (caught) {
      setProcessing(false);
      const missing = isMissingRolesTable(
        caught && typeof caught === "object"
          ? (caught as { message?: string; code?: string })
          : null,
      );
      toast(
        missing
          ? "Run the roles migrations in Supabase first, including 0022."
          : "Could not save this role. Try again.",
        "error",
      );
    }
  }

  async function findMatches() {
    if (!ready || processing) return;
    if (mode === "url") {
      setProcessing(true);
      setDoneCount(0);
      const result = await importJdFromUrlAction(value.trim());
      if (!result.ok) {
        setProcessing(false);
        toast(result.error, "error");
        return;
      }
      void runProcessing(result.draft);
      return;
    }
    void runProcessing(extractRoleFromJd(value));
  }

  if (builderDraft) {
    return (
      <RoleBuilder
        supabase={supabase}
        companyId={companyId}
        initialDraft={builderDraft}
        editingId={null}
        onCancel={() => {
          setBuilderDraft(null);
          setDoneCount(0);
        }}
        onSaved={(saved) => {
          router.push(`/roles/${saved.id}/matches`);
          router.refresh();
        }}
      />
    );
  }

  if (processing) {
    return <JobProcessing doneCount={doneCount} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/roles"
          className="text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          Back to roles
        </Link>
        <h2 className="mt-2 font-display text-xl font-semibold text-mingle-text">
          What are you hiring for?
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          Paste a description or an Israeli job-board URL. We fill the existing
          role builder where the text is clear, and ask you to tap the rest.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["text", "Paste text"],
            ["url", "Paste URL"],
            ["manual", "Write manually"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === "manual") {
                router.push("/roles?new=1");
                return;
              }
              setMode(id);
            }}
            className={`rounded-full px-4 py-2 font-display text-xs font-semibold ${
              mode === id
                ? "bg-mingle-lavender text-mingle-text"
                : "text-mingle-text-secondary hover:text-mingle-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={mode === "url" ? 4 : 12}
        placeholder={
          mode === "url"
            ? "https://www.alljobs.co.il/... or drushim / jobmaster"
            : "Paste the job description, or switch to Paste URL for AllJobs / Drushim / JobMaster."
        }
        className="w-full resize-y rounded-2xl border border-mingle-border bg-mingle-white p-4 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
      />

      {mode === "url" ? (
        <p className="text-xs text-mingle-text-secondary">{URL_HINT}</p>
      ) : null}

      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          void findMatches();
        }}
        className={`self-start rounded-full px-6 py-3 font-display text-sm font-semibold ${
          ready
            ? "bg-mingle-cta text-white"
            : "cursor-not-allowed bg-mingle-surface text-mingle-text-secondary"
        }`}
      >
        Find my matches
      </button>
    </div>
  );
}
