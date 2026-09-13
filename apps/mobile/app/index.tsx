import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

export default function Index() {
  const auth = useAuth();
  const { colors } = useTheme();

  if (!auth.ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
          gap: 12,
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          mingle
        </Text>
        <ActivityIndicator color={brand.cta} size="large" />
      </View>
    );
  }

  if (!auth.configured) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: colors.background,
          padding: 24,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>
          mingle
        </Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textSecondary }}>
          Missing Supabase keys in apps/mobile/.env. Add EXPO_PUBLIC_SUPABASE_URL
          and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart Expo.
        </Text>
      </View>
    );
  }

  if (!auth.session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const userType = auth.profile?.user_type ?? auth.pathPreference ?? "talent";
  const onboarded =
    auth.profile?.onboarding_status === "completed" ||
    (auth.profile?.onboarding_step ?? 0) >= 4;

  if (!onboarded) {
    return (
      <Redirect
        href={
          userType === "company"
            ? "/(auth)/onboarding-company"
            : "/(auth)/onboarding-talent"
        }
      />
    );
  }

  return (
    <Redirect
      href={
        userType === "company"
          ? "/(company)/dashboard"
          : "/(talent)/dashboard"
      }
    />
  );
}
