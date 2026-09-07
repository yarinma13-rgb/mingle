"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

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
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const sections = useMemo(
    () => [
      {
        id: "account",
        title: "Account",
        items: [
          {
            id: "signed-in",
            title: "Signed in as",
            body: email,
          },
          {
            id: "path",
            title: "Path",
            body: pathLabel,
          },
          {
            id: "profile",
            title: "Edit profile",
            body: "Update the profile companies and talent see.",
            href: profileHref,
            action: "Open profile",
          },
        ],
      },
      {
        id: "security",
        title: "Security",
        items: [
          {
            id: "password",
            title: "Password",
            body: "Change the password for this account.",
          },
        ],
      },
      {
        id: "notifications",
        title: "Notifications",
        items: [
          {
            id: "email-alerts",
            title: "Email alerts",
            body: "Connection and conversation emails stay on for now. Granular toggles will land here.",
          },
        ],
      },
      {
        id: "privacy",
        title: "Privacy",
        items: [
          {
            id: "visibility",
            title: "Profile visibility",
            body: isCompany
              ? "Your company profile is visible to talent on mingle."
              : "Your talent profile is visible to companies on mingle.",
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
                  title: "Team members",
                  body: "Invite HR and hiring managers once team accounts ship.",
                  href: "/team",
                  action: "Open Team",
                },
              ],
            },
          ]
        : []),
    ],
    [email, isCompany, pathLabel, profileHref],
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <label className="block">
        <span className="sr-only">Search settings</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search settings"
          className="w-full rounded-[10px] border border-mingle-border bg-mingle-white px-4 py-2.5 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none"
        />
      </label>

      {visible.length === 0 ? (
        <p className="text-sm text-mingle-text-secondary">
          No settings match that search.
        </p>
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
                  {"href" in item && item.href ? (
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
          </section>
        ))
      )}

      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle">
        <SignOutButton />
      </div>
    </div>
  );
}
