"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { PushOptIn } from "@/components/push/PushOptIn";
import { GoogleCalendarConnectCard } from "@/components/interviews/ScheduleInterviewControls";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";
import {
  LocaleGlobeButton,
  useAppLocale,
} from "@/components/i18n/AppLocaleProvider";

type SettingsHubProps = {
  email: string;
  pathLabel: string;
  profileHref: string;
  isCompany: boolean;
};

export function SettingsHub({
  email,
  pathLabel,
  profileHref,
  isCompany,
}: SettingsHubProps) {
  const { t, dir, locale } = useAppLocale();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const sections = useMemo(
    () => [
      {
        id: "account",
        title: t.settings.account,
        items: [
          {
            id: "signed-in",
            title: t.settings.signedInAs,
            body: email,
          },
          {
            id: "path",
            title: t.settings.path,
            body:
              pathLabel === "Company" || pathLabel === "company"
                ? t.auth.segmentCompany
                : t.auth.segmentTalent,
          },
          {
            id: "profile",
            title: t.settings.editProfile,
            body: t.settings.editProfileBody,
            href: profileHref,
            action: t.settings.openProfile,
          },
          {
            id: "language",
            title: t.settings.language,
            body: t.settings.languageBody,
          },
        ],
      },
      {
        id: "security",
        title: t.settings.security,
        items: [
          {
            id: "password",
            title: t.settings.password,
            body: t.settings.passwordBody,
          },
        ],
      },
      {
        id: "notifications",
        title: t.settings.notifications,
        items: [
          {
            id: "email-alerts",
            title: t.settings.emailAlerts,
            body: t.settings.emailAlertsBody,
          },
        ],
      },
      {
        id: "privacy",
        title: t.settings.privacy,
        items: [
          {
            id: "visibility",
            title: t.settings.visibility,
            body: isCompany
              ? t.settings.visibilityCompany
              : t.settings.visibilityTalent,
          },
        ],
      },
      {
        id: "support",
        title: t.settings.support,
        items: [
          {
            id: "report-problem",
            title: t.settings.reportProblem,
            body: t.settings.reportProblemBody,
            href: "/settings/support",
            action: t.settings.openSupport,
          },
        ],
      },
      ...(isCompany
        ? [
            {
              id: "workspace",
              title: "Workspace",
              items: [
                {
                  id: "team",
                  title: t.shell.team,
                  body: "Invite HR and hiring managers once team accounts ship.",
                  href: "/team",
                  action: t.shell.team,
                },
              ],
            },
          ]
        : []),
    ],
    [email, isCompany, pathLabel, profileHref, t],
  );

  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!needle) return true;
        return `${section.title} ${item.title} ${item.body}`
          .toLowerCase()
          .includes(needle);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5" dir={dir} lang={locale}>
      <label className="block">
        <span className="sr-only">{t.settings.search}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.settings.search}
          className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-2.5 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
        />
      </label>

      {visible.length === 0 ? (
        <p className="text-sm text-mingle-text-secondary">{t.settings.noMatch}</p>
      ) : (
        visible.map((section) => (
          <section
            key={section.id}
            className="overflow-hidden rounded-2xl border border-mingle-border bg-mingle-white shadow-mingle"
          >
            <h2 className="border-b border-mingle-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">
              {section.title}
            </h2>
            <ul>
              {section.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 border-b border-mingle-border px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-mingle-text">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-mingle-text-secondary">
                      {item.body}
                    </p>
                  </div>
                  {item.id === "language" ? (
                    <LocaleGlobeButton />
                  ) : "href" in item && item.href ? (
                    <Link
                      href={item.href}
                      className="mingle-btn-secondary shrink-0 text-xs"
                    >
                      {item.action}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
            {section.id === "security" ? (
              <div className="border-t border-mingle-border px-5 py-5">
                <ChangePasswordForm />
              </div>
            ) : null}
            {section.id === "notifications" ? (
              <div className="border-t border-mingle-border px-5 py-5">
                <PushOptIn />
              </div>
            ) : null}
            {section.id === "workspace" ? (
              <div className="border-t border-mingle-border px-5 py-5">
                <GoogleCalendarConnectCard />
              </div>
            ) : null}
          </section>
        ))
      )}

      <DeleteAccountCard />

      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle">
        <SignOutButton />
      </div>
    </div>
  );
}
