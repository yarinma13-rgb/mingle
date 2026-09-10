"use server";

import { sendConnectionRequestEmail } from "@/lib/email/connection-request";
import { notifyPushConnection } from "@/lib/push/actions";

export async function notifyConnectionRequest(toUserId: string): Promise<void> {
  try {
    await sendConnectionRequestEmail(toUserId);
  } catch {
    // Missing key, Resend outage, or RLS: the connection already saved.
  }
  try {
    await notifyPushConnection(toUserId);
  } catch {
    // VAPID or table missing: email (if sent) is enough.
  }
}
