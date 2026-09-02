import { z } from "zod";

export const basicProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  headline: z.string().trim().min(1, "Enter a professional title").max(120),
  location: z.string().trim().min(1, "Enter your location").max(120),
  yearsExperience: z
    .number({ error: "Enter years of experience" })
    .int()
    .min(0, "Must be 0 or more")
    .max(60, "That doesn't look right"),
  currentRole: z.string().trim().min(1, "Enter your current role").max(120),
  industry: z.string().trim().min(1, "Enter your industry").max(120),
});

export type BasicProfileValues = z.infer<typeof basicProfileSchema>;

export const beyondCvSchema = z
  .string()
  .trim()
  .min(20, "Tell us a bit more, at least a couple sentences")
  .max(2000, "Keep it under 2000 characters");
