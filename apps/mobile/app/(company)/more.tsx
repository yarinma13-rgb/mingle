import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Screen, ThemeToggle } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

const LINKS = [
  { label: "Company profile", href: "/company-profile/build" },
  { label: "Roles", href: "/roles" },
  { label: "Paste a job description", href: "/roles/paste" },
  { label: "Team", href: "/team" },
  { label: "Interviews", href: "/interviews" },
  { label: "Saved", href: "/saved" },
  { label: "Settings", href: "/settings" },
  { label: "Support", href: "/settings/support" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
] as const;

export default function CompanyMore() {
  const { signOut, profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <AppHeader title="More" right={<ThemeToggle />} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Body muted>{profile?.email}</Body>
        {LINKS.map((link) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
              }}
            >
              {link.label}
            </Text>
          </Pressable>
        ))}
        <View style={{ height: 8 }} />
        <Pressable
          onPress={async () => {
            try {
              await signOut();
              router.replace("/(auth)/welcome");
            } catch (e) {
              Alert.alert(
                "Sign out failed",
                e instanceof Error ? e.message : "Try again",
              );
            }
          }}
          style={{ padding: 16, alignItems: "center" }}
        >
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              color: colors.textSecondary,
            }}
          >
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
