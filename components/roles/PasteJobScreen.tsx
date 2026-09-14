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
  looksLikeUrl,
  roleExtractNeedsBuilder,
} from "@/lib/roles/extract-jd";
import { importJdFromUrlAction } from "@/lib/roles/import-jd-action";
import { structureJobFromFreeTextAction } from "@/lib/roles/structure-jd-action";
import {
  composeRoleDescription,
  draftFromStructuredJd,
  type StructuredJd,
} from "@/lib/roles/structure-jd";

type PasteMode = "text" | "url" | "manual";
type Phase = "input" | "processing" | "review" | "builder";

const STEPS = [
  "Reading the job description",
  "Structuring with AI",
  "Preparing the role",
] as const;

const URL_HINT =
  "Supports AllJobs, Drushim, and JobMaster links. LinkedIn is not supported.";

function JobProcessing({ doneCount }: { doneCount: number }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-6 text-center">
      <p className="font-display text-lg font-semibold text-mingle-text">
        Structuring your role
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
    </div>
  );
}

function StructuredReview({
  structured,
  usedAi,
  onChange,
  onBack,
  onContinue,
}: {
  structured: StructuredJd;
  usedAi: boolean;
  onChange: (next: StructuredJd) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const fields: Array<{
    key: keyof Pick<
      StructuredJd,
      | "companyPresentation"
      | "jobPresentation"
      | "responsibilities"
      | "requirements"
    >;
    label: string;
    rows: number;
  }> = [
    { key: "companyPresentation", label: "Company presentation", rows: 4 },
    { key: "jobPresentation", label: "Job presentation", rows: 4 },
    { key: "responsibilities", label: "Responsibilities", rows: 5 },
    { key: "requirements", label: "Requirements", rows: 5 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-mingle-text">
          Review structured role
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          {usedAi
            ? "Gemini drafted these sections from your paste. Edit anything, then continue to the role builder."
            : "Structured from your paste with heuristics (Gemini key not set). Edit anything, then continue."}
        </p>
      </div>

      {fields.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
            {field.label}
          </span>
          <textarea
            dir="auto"
            value={structured[field.key]}
            onChange={(event) =>
              onChange({ ...structured, [field.key]: event.target.value })
            }
            rows={field.rows}
            className="w-full resize-y rounded-2xl border border-mingle-border bg-mingle-white p-4 text-sm text-mingle-text focus:border-mingle-blue focus:outline-none"
          />
        </label>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-mingle-surface px-6 py-3 font-display text-sm font-semibold text-mingle-text"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-full bg-mingle-cta px-6 py-3 font-display text-sm font-semibold text-white"
        >
          Continue to role builder
        </button>
      </div>
    </div>
  );
}

export function PasteJobScreen({ companyId }: { companyId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<PasteMode>("text");
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [doneCount, setDoneCount] = useState(0);
  const [structured, setStructured] = useState<StructuredJd | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [builderDraft, setBuilderDraft] = useState<RoleDraft | null>(null);

  const ready =
    mode === "text"
      ? value.trim().length > 40
      : mode === "url"
        ? looksLikeUrl(value)
        : false;

  async function animateSteps() {
    setDoneCount(0);
    for (let i = 1; i <= STEPS.length; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setDoneCount(i);
    }
  }

  async function openBuilder(draft: RoleDraft) {
    if (roleExtractNeedsBuilder(draft)) {
      setBuilderDraft(draft);
      setPhase("builder");
      toast("Some fields need a tap in the builder.");
      return;
    }
    try {
      const saved = await createCompanyRole(supabase, companyId, draft);
      router.push(`/roles/${saved.id}/matches`);
      router.refresh();
    } catch (caught) {
      setPhase("review");
      const missing = isMissingRolesTable(
        caught && typeof caught === "object"
          ? (caught as { message?: string; code?: string })
          : null,
      );
      toast(
        missing
          ? "Run the roles migrations in Supabase first, including 0031."
          : "Could not save this role. Try again.",
        "error",
      );
    }
  }

  async function findMatches() {
    if (!ready || phase === "processing") return;
    setPhase("processing");
    void animateSteps();

    if (mode === "url") {
      const result = await importJdFromUrlAction(value.trim());
      if (!result.ok) {
        setPhase("input");
        toast(result.error, "error");
        return;
      }
      const source = result.draft.sourceJd || value.trim();
      const structuredResult = await structureJobFromFreeTextAction(source);
      if (!structuredResult.ok) {
        setPhase("input");
        toast(structuredResult.error, "error");
        return;
      }
      setSourceText(source);
      setSourceUrl(result.draft.sourceUrl || value.trim());
      setStructured(structuredResult.structured);
      setUsedAi(structuredResult.usedAi);
      setPhase("review");
      return;
    }

    const structuredResult = await structureJobFromFreeTextAction(value);
    if (!structuredResult.ok) {
      setPhase("input");
      toast(structuredResult.error, "error");
      return;
    }
    setSourceText(value.trim());
    setSourceUrl("");
    setStructured(structuredResult.structured);
    setUsedAi(structuredResult.usedAi);
    setPhase("review");
  }

  if (phase === "builder" && builderDraft) {
    return (
      <RoleBuilder
        supabase={supabase}
        companyId={companyId}
        initialDraft={builderDraft}
        editingId={null}
        onCancel={() => {
          setBuilderDraft(null);
          setPhase(structured ? "review" : "input");
          setDoneCount(0);
        }}
        onSaved={(saved) => {
          router.push(`/roles/${saved.id}/matches`);
          router.refresh();
        }}
      />
    );
  }

  if (phase === "processing") {
    return <JobProcessing doneCount={doneCount} />;
  }

  if (phase === "review" && structured) {
    return (
      <StructuredReview
        structured={structured}
        usedAi={usedAi}
        onChange={setStructured}
        onBack={() => setPhase("input")}
        onContinue={() => {
          const draft = draftFromStructuredJd(structured, sourceText, sourceUrl);
          draft.description = composeRoleDescription(structured);
          draft.companyPresentation = structured.companyPresentation;
          draft.jobPresentation = structured.jobPresentation;
          draft.responsibilities = structured.responsibilities;
          draft.requirements = structured.requirements;
          void openBuilder(draft);
        }}
      />
    );
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
          Paste free-text requirements. Gemini rewrites them into company
          presentation, job presentation, responsibilities, and requirements —
          then you can edit before saving.
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
        Structure with AI
      </button>
    </div>
  );
}
