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
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const { colors, theme } = useTheme();
  const router = useRouter();

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
