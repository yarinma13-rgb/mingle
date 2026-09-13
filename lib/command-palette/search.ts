"use server";

import { createClient } from "@/lib/supabase/server";
import type { CommandItem } from "@/lib/command-palette/items";

function sanitize(raw: string): string {
  return raw.trim().replace(/[%_,]/g, " ").slice(0, 80);
}

/** Live candidate + role hits for the company command palette. */
export async function searchCompanyCommandItems(
  query: string,
): Promise<CommandItem[]> {
  const needle = sanitize(query);
  if (needle.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: account } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.user_type !== "company") return [];

  const pattern = `%${needle}%`;
  const [{ data: talents }, { data: roles }] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("user_id, first_name, last_name, headline, current_job_title")
      .or(
        [
          `first_name.ilike."${pattern}"`,
          `last_name.ilike."${pattern}"`,
          `headline.ilike."${pattern}"`,
          `current_job_title.ilike."${pattern}"`,
        ].join(","),
      )
      .limit(8),
    supabase
      .from("roles")
      .select("id, title, department, status")
      .eq("company_id", user.id)
      .ilike("title", pattern)
      .limit(8),
  ]);

  const talentItems: CommandItem[] = (talents ?? []).map((row) => {
    const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Talent";
    const detail =
      row.headline?.trim() || row.current_job_title?.trim() || "Candidate";
    return {
      id: `talent-${row.user_id}`,
      label: `${name} · ${detail}`,
      href: `/profile/view/${row.user_id}`,
      keywords: [name, detail, "candidate", "talent"],
    };
  });

  const roleItems: CommandItem[] = (roles ?? []).map((row) => ({
    id: `role-${row.id}`,
    label: `${row.title}${row.department ? ` · ${row.department}` : ""}`,
    href: `/roles/${row.id}/matches`,
    keywords: [row.title, row.department ?? "", row.status, "role", "job"],
  }));

  return [...talentItems, ...roleItems];
}

/** Live company hits for the talent command palette. */
export async function searchTalentCommandItems(
  query: string,
): Promise<CommandItem[]> {
  const needle = sanitize(query);
  if (needle.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: account } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.user_type !== "talent") return [];

  const pattern = `%${needle}%`;
  const { data: companies } = await supabase
    .from("company_profiles")
    .select("user_id, company_name, industry, location")
    .or(
      [
        `company_name.ilike."${pattern}"`,
        `industry.ilike."${pattern}"`,
        `location.ilike."${pattern}"`,
      ].join(","),
    )
    .limit(10);

  return (companies ?? []).map((row) => {
    const name = row.company_name?.trim() || "Company";
    const detail = [row.industry, row.location]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(" · ");
    return {
      id: `company-${row.user_id}`,
      label: detail ? `${name} · ${detail}` : name,
      href: `/profile/view/${row.user_id}`,
      keywords: [name, row.industry ?? "", row.location ?? "", "company"],
    };
  });
}
