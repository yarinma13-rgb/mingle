"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/app-origin";

type PushPayload = {
  title: string;
  body: string;
  url: string;
};

function vapidReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

function configureVapid() {
  webpush.setVapidDetails(
    appOrigin(),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
}

export async function savePushSubscription(input: {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
}): Promise<{ ok: boolean }> {
  const endpoint = input.endpoint?.trim();
  const p256dh = input.keys?.p256dh?.trim();
  const auth = input.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) return { ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: "endpoint" },
  );
  return { ok: !error };
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
}

export async function notifyPushToUser(
  targetUserId: string,
  payload: PushPayload,
): Promise<void> {
  if (!vapidReady() || !targetUserId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetUserId) return;
  const { data, error } = await supabase.rpc("list_related_push_subscriptions", {
    p_user_id: targetUserId,
  });
  if (error || !data?.length) return;
  configureVapid();
  const body = JSON.stringify(payload);
  await Promise.all(
    data.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
        );
      } catch {
        // Expired endpoints stay until the owner re-subscribes.
      }
    }),
  );
}

export async function notifyPushMatch(targetUserId: string): Promise<void> {
  await notifyPushToUser(targetUserId, {
    title: "mingle",
    body: "Someone marked a match with you.",
    url: "/discover",
  });
}

export async function notifyPushMessage(targetUserId: string): Promise<void> {
  await notifyPushToUser(targetUserId, {
    title: "mingle",
    body: "You have a new message.",
    url: "/conversations",
  });
}

export async function notifyPushConnection(targetUserId: string): Promise<void> {
  await notifyPushToUser(targetUserId, {
    title: "mingle",
    body: "Someone wants to connect.",
    url: "/connections",
  });
}
