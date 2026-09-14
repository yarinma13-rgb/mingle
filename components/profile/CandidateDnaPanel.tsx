import Link from "next/link";
import {
  BriefcaseIcon,
  CompassIcon,
  TargetIcon,
} from "@/components/dashboard/icons";
import { MingleChip } from "@/components/MingleChip";
import type { CandidateDna } from "@/lib/matching/dna";

function Group({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-purple">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mingle-lavender text-mingle-purple">
          <Icon size={14} />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function CandidateDnaPanel({
  dna,
  editHref = "/profile/build",
}: {
  dna: CandidateDna;
  editHref?: string;
}) {
  const empty =
    dna.professional.length === 0 &&
    dna.preferences.length === 0 &&
    dna.motivations.length === 0 &&
    dna.workStyle.length === 0;

  return (
    <section className="profile-section flex flex-col gap-5 rounded-2xl border border-mingle-border/70 bg-mingle-white p-6 shadow-mingle sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
            Your Candidate DNA
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
            What mingle already knows from your profile. Read only here. Edit in
            the profile wizard.
          </p>
        </div>
        <Link href={editHref} className="mingle-btn-secondary text-xs">
          Edit profile
        </Link>
      </div>

      {empty ? (
        <p className="text-sm text-mingle-text-secondary">
          Nothing to show yet. Fill in your profile and this panel will catch up.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Group title="Professional capabilities" icon={BriefcaseIcon}>
            {dna.professional.length === 0 ? (
              <p className="text-xs text-mingle-text-secondary">Not set yet.</p>
            ) : (
              <dl className="flex flex-col gap-2.5">
                {dna.professional.map((row) => (
                  <div key={row.label}>
                    <dt className="text-[11px] font-semibold text-mingle-text-secondary">
                      {row.label}
                    </dt>
                    <dd className="text-sm text-mingle-text">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Group>
          <Group title="Preferences" icon={CompassIcon}>
            {dna.preferences.length === 0 ? (
              <p className="text-xs text-mingle-text-secondary">Not set yet.</p>
            ) : (
              <dl className="flex flex-col gap-2.5">
                {dna.preferences.map((row) => (
                  <div key={row.label}>
                    <dt className="text-[11px] font-semibold text-mingle-text-secondary">
                      {row.label}
                      {row.private ? " (private)" : ""}
                    </dt>
                    <dd className="text-sm text-mingle-text">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Group>
          <Group title="Motivation signals" icon={TargetIcon}>
            {dna.motivations.length === 0 && dna.workStyle.length === 0 ? (
              <p className="text-xs text-mingle-text-secondary">Not set yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {dna.motivations.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {dna.motivations.map((item) => (
                      <MingleChip key={item}>{item}</MingleChip>
                    ))}
                  </div>
                ) : null}
                {dna.workStyle.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-mingle-text-secondary">
                      How you like to work
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dna.workStyle.map((item) => (
                        <MingleChip key={item} tone="pink">
                          {item}
                        </MingleChip>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </Group>
        </div>
      )}
    </section>
  );
}
