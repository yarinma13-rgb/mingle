import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Body, Screen, Subtitle, Title } from "@/src/components/ui";
import { resolveGate } from "@/src/lib/routing";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

export default function Index() {
  const auth = useAuth();
  const { colors } = useTheme();
  const gate = resolveGate({
    ready: auth.ready,
    configured: auth.configured,
    session: Boolean(auth.session),
    profile: auth.profile,
    pathPreference: auth.pathPreference,
  });

  if (gate.kind === "loading") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={brand.cta} size="large" />
      </View>
    );
  }

  if (gate.kind === "unconfigured") {
    return (
      <Screen style={{ padding: 24, justifyContent: "center" }}>
        <Title>mingle</Title>
        <Subtitle>
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in
          apps/mobile/.env to connect this native app to Supabase.
        </Subtitle>
        <View style={{ height: 16 }} />
        <Body muted>
          Separate from the Next.js website — React Native for the stores.
        </Body>
      </Screen>
    );
  }

  if (gate.kind === "welcome") return <Redirect href="/(auth)/welcome" />;

  if (gate.kind === "onboarding") {
    return (
      <Redirect
        href={
          gate.userType === "company"
            ? "/(auth)/onboarding-company"
            : "/(auth)/onboarding-talent"
        }
      />
    );
  }

  return (
    <Redirect
      href={
        gate.userType === "company"
          ? "/(company)/dashboard"
          : "/(talent)/dashboard"
      }
    />
  );
}
