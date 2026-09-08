import { z } from "zod";
import { whatsappDigits } from "@/lib/recommendations/phone";

export const recommendationRequestSchema = z
  .object({
    recommenderName: z.string().trim().min(1, "Add their name").max(120),
    recommenderContact: z.string().trim().min(1, "Add a way to reach them").max(200),
    deliveryMethod: z.enum(["email", "whatsapp"]),
  })
  .superRefine((value, ctx) => {
    if (value.deliveryMethod === "email") {
      const email = z.string().email().safeParse(value.recommenderContact);
      if (!email.success) {
        ctx.addIssue({
          code: "custom",
          path: ["recommenderContact"],
          message: "Use a valid email",
        });
      }
      return;
    }
    if (!whatsappDigits(value.recommenderContact)) {
      ctx.addIssue({
        code: "custom",
        path: ["recommenderContact"],
        message: "Use a phone number with country code",
      });
    }
  });

export const recommendationSubmitSchema = z.object({
  token: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(1, "Write a few words").max(2000),
});
