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
  "Growth",
  "Operations",
  "Customer success",
  "People",
  "HR",
  "Finance",
  "Legal",
  "Research",
  "Construction",
  "Infrastructure",
  "Building supervision",
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
  "SEO",
  "PPC",
  "People operations",
  "Talent acquisition",
  "Recruiting",
  "Project management",
  "Customer support",
  "Site supervision",
  "Building codes",
  "Construction planning",
  "Safety management",
  "Infrastructure design",
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
    "Customer Success & Account Manager",
  ],
  Marketing: [
    "Marketing manager",
    "Content marketer",
    "Growth marketer",
    "Product marketer",
    "Brand manager",
    "Performance marketer",
  ],
  Growth: [
    "Growth manager",
    "Growth marketer",
    "Lifecycle manager",
  ],
  Operations: [
    "Operations manager",
    "Chief of staff",
    "Program manager",
  ],
  "Customer success": [
    "Customer Success & Account Manager",
    "Customer success manager",
    "Account manager",
    "Support lead",
  ],
  People: [
    "People partner",
    "Recruiter",
    "People operations",
  ],
  HR: [
    "HR manager",
    "Talent acquisition lead",
    "HR business partner",
    "People operations specialist",
  ],
  Finance: [
    "Finance manager",
    "Controller",
  ],
  Legal: [
    "Legal counsel",
    "Compliance manager",
  ],
  Research: [
    "Researcher",
    "Research scientist",
  ],
  Construction: [
    "Construction manager",
    "Site manager",
    "Project engineer",
    "Quantity surveyor",
  ],
  Infrastructure: [
    "Infrastructure engineer",
    "Civil engineer",
    "Utilities project manager",
  ],
  "Building supervision": [
    "Building supervisor",
    "Site supervisor",
    "Construction inspector",
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
