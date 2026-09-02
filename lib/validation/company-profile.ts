import { z } from "zod";

export const companyBasicInfoSchema = z.object({
  companyName: z.string().trim().min(1, "Enter your company name").max(120),
  mission: z.string().trim().min(1, "Enter a one line mission").max(160),
  industry: z.string().trim().min(1, "Enter your industry").max(120),
  companyStage: z.string().trim().min(1, "Choose a stage"),
  companySize: z.string().trim().min(1, "Choose a size"),
  location: z.string().trim().min(1, "Enter your location").max(120),
});

export type CompanyBasicInfoValues = z.infer<typeof companyBasicInfoSchema>;

export const shortReflectionSchema = z
  .string()
  .trim()
  .min(20, "Tell us a bit more, at least a couple sentences")
  .max(1200, "Keep it under 1200 characters");
