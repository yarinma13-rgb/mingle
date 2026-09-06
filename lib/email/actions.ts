"use server";

import { sendConnectionRequestEmail } from "@/lib/email/connection-request";

export async function notifyConnectionRequest(toUserId: string): Promise<void> {
  try {
    await sendConnectionRequestEmail(toUserId);
  } catch {
    // Missing key, Resend outage, or RLS: the connection already saved.
  }
}
