import { z } from "zod";
import { WORK_MODEL_OPTIONS } from "@/lib/discovery/filters";
import {
  ROLE_DEPARTMENT_OPTIONS,
  ROLE_SENIORITY_OPTIONS,
} from "@/lib/roles/questions";

export const roleDraftSchema = z.object({
  title: z.string().trim().min(1, "Give this role a title").max(120),
  department: z
    .string()
    .trim()
    .refine((value) => (ROLE_DEPARTMENT_OPTIONS as readonly string[]).includes(value), {
      message: "Choose a department",
    }),
  seniority: z
    .string()
    .trim()
    .refine((value) => (ROLE_SENIORITY_OPTIONS as readonly string[]).includes(value), {
      message: "Choose a seniority",
    }),
  employmentType: z.enum(["full_time", "part_time", "contract", "freelance"]),
  workModel: z.enum(WORK_MODEL_OPTIONS),
  requiredSkills: z.array(z.string().trim().min(1)).max(5),
  description: z.string().trim().max(1200),
});

export const roleStatusSchema = z.enum(["open", "paused", "closed"]);

export type RoleDraftValues = z.infer<typeof roleDraftSchema>;
