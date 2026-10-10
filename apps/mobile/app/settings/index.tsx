import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Button,
  Card,
  Screen,
  Subtitle,
  ThemeToggle,
  Title,
} from "@/src/components/ui";
import { saveMobilePushToken } from "@/src/lib/api";
import { registerForPushNotificationsAsync } from "@/src/lib/pushNotifications";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [enablingPush, setEnablingPush] = useState(false);

  async function onSignOut() {
    try {
      await signOut();
      router.replace("/(auth)/welcome");
    } catch (e) {
      Alert.alert(
        "Could not sign out",
        e instanceof Error ? e.message : "Try again",
      );
    }
  }

  async function onEnablePush() {
    if (!user) return;
    setEnablingPush(true);
    try {
      const result = await registerForPushNotificationsAsync();
      if (!result.ok) {
        const message =
          result.reason === "permission-denied"
            ? "Notifications are off for mingle in your device settings."
            : result.reason === "no-eas-project"
              ? "Push isn't set up for this build yet."
              : result.reason === "unsupported"
                ? "Push notifications aren't available on web."
                : "Couldn't turn on notifications. Try again.";
        Alert.alert("Push notifications", message);
        return;
      }
      await saveMobilePushToken(user.id, result.token);
      Alert.alert("Push notifications", "You're set up for push on this device.");
    } catch (e) {
      Alert.alert(
        "Couldn't turn on notifications",
        e instanceof Error ? e.message : "Try again.",
      );
    } finally {
      setEnablingPush(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Settings" showBack />
      <View style={{ padding: 16, gap: 14 }}>
        <Title>Settings</Title>
        <Subtitle>Account, theme, and support.</Subtitle>

        <Card>
          <Body muted>Signed in as</Body>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              color: colors.text,
              marginTop: 6,
            }}
          >
            {user?.email ?? "—"}
          </Text>
          <Body muted>
            {profile?.user_type ?? "—"} · theme {theme}
          </Body>
        </Card>

        <Card>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.text,
                }}
              >
                Appearance
              </Text>
              <Body muted>Light / Dark for every user path.</Body>
            </View>
            <ThemeToggle />
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <View>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
              }}
            >
              Push notifications
            </Text>
            <Body muted>Get notified on this device for new messages and connections.</Body>
          </View>
          <Button
            label={enablingPush ? "Turning on…" : "Enable push notifications"}
            onPress={onEnablePush}
            loading={enablingPush}
            variant="secondary"
          />
        </Card>

        <Card>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Coming soon
          </Text>
          <Body muted>Email alerts</Body>
          <Body muted>Profile visibility</Body>
        </Card>

        <Pressable onPress={() => router.push("/settings/support")}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              color: brand.cta,
            }}
          >
            Support →
          </Text>
        </Pressable>

        <Button label="Sign out" variant="danger" onPress={onSignOut} />
      </View>
    </Screen>
  );
}
