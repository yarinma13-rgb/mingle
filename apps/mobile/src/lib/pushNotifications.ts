import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Client-side half of mobile push (server-side send is not wired up yet —
// see supabase/migrations/0047_mobile_push_tokens.sql). This only gets a
// device as far as "permission granted, token saved"; nothing triggers a
// send on new message/connection/match yet.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: "unsupported" | "permission-denied" | "no-eas-project" | "error" };

/**
 * Requests notification permission and returns an Expo push token.
 * Returns `no-eas-project` until an EAS project id is configured in
 * app.json (`expo.extra.eas.projectId`) — Expo's push service requires
 * one to issue tokens, and this app doesn't have an EAS project set up
 * yet (same gap as "no App Store / Play accounts yet" in the README).
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (Platform.OS === "web") return { ok: false, reason: "unsupported" };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return { ok: false, reason: "permission-denied" };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return { ok: false, reason: "no-eas-project" };
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { ok: true, token };
  } catch {
    return { ok: false, reason: "error" };
  }
}
