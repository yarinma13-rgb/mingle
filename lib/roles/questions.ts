import { WORK_MODEL_OPTIONS } from "@/lib/discovery/filters";
import type { RoleEmploymentType, RoleStatus } from "@/lib/supabase/types";

export { WORK_MODEL_OPTIONS };

export const ROLE_DEPARTMENT_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Sales",
  "Marketing",
  "Operations",
  "Customer success",
  "People",
  "Finance",
  "Research",
  "Leadership",
] as const;

export const ROLE_SENIORITY_OPTIONS = [
  "Intern",
  "Junior",
  "Mid",
  "Senior",
  "Staff",
  "Principal",
  "Lead",
  "Director",
  "VP",
  "C level",
] as const;

export const ROLE_EMPLOYMENT_OPTIONS: {
  value: RoleEmploymentType;
  label: string;
}[] = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
];

export const ROLE_STATUS_OPTIONS: { value: RoleStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
];

export const ROLE_SKILL_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "SQL",
  "Product strategy",
  "User research",
  "UI design",
  "Figma",
  "Data analysis",
  "Machine learning",
  "Sales",
  "Account management",
  "Content",
  "Growth",
  "Brand",
  "People operations",
  "Project management",
  "Customer support",
] as const;

export const ROLE_TITLE_SUGGESTIONS: Record<string, string[]> = {
  Engineering: [
    "Software engineer",
    "Frontend engineer",
    "Backend engineer",
    "Full stack engineer",
    "Mobile engineer",
  ],
  Product: [
    "Product manager",
    "Product owner",
    "Product analyst",
  ],
  Design: [
    "Product designer",
    "UX designer",
    "Brand designer",
  ],
  Data: [
    "Data analyst",
    "Data scientist",
    "Analytics engineer",
  ],
  Sales: [
    "Account executive",
    "Sales development",
    "Customer success manager",
  ],
  Marketing: [
    "Marketing manager",
    "Content marketer",
    "Growth marketer",
  ],
  Operations: [
    "Operations manager",
    "Chief of staff",
    "Program manager",
  ],
  "Customer success": [
    "Customer success manager",
    "Support lead",
  ],
  People: [
    "People partner",
    "Recruiter",
    "People operations",
  ],
  Finance: [
    "Finance manager",
    "Controller",
  ],
  Research: [
    "Researcher",
    "Research scientist",
  ],
  Leadership: [
    "Engineering manager",
    "Head of product",
    "Team lead",
  ],
};

export function employmentLabel(value: string | null): string {
  return (
    ROLE_EMPLOYMENT_OPTIONS.find((option) => option.value === value)?.label ??
    value ??
    ""
  );
}

export function statusLabel(value: RoleStatus): string {
  return ROLE_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
