import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Card,
  EmptyState,
  LoadingBlock,
  Screen,
  StatusBadge,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { fetchDashboardStats } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand, scoreTone } from "@/src/theme/tokens";

export default function CompanyDashboard() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    connections: 0,
    saved: 0,
    conversations: 0,
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setStats(await fetchDashboardStats(user.id, "company"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const completion = profile?.profile_completion ?? 0;

  return (
    <Screen>
      <AppHeader title="mingle" />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        <Title>Hiring home</Title>
        <Subtitle>
          Track relationships, review candidates, and move people through your
          board.
        </Subtitle>

        <Card>
          <Body muted>Company profile</Body>
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 32,
              color: scoreTone(completion),
              marginTop: 4,
            }}
          >
            {completion}%
          </Text>
          <View style={{ height: 10 }} />
          <StatusBadge
            label={
              completion >= 80
                ? "Ready to attract talent"
                : "Complete your company profile"
            }
            tone={completion >= 80 ? "success" : "warning"}
          />
          <Pressable
            onPress={() => router.push("/company-profile/build")}
            style={{ marginTop: 12 }}
          >
            <Text style={{ fontFamily: "Poppins_600SemiBold", color: brand.cta }}>
              Edit company profile →
            </Text>
          </Pressable>
        </Card>

        {loading && stats.connections === 0 ? (
          <LoadingBlock />
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              {
                label: "Connections",
                value: stats.connections,
                href: "/(company)/conversations",
              },
              {
                label: "Chats",
                value: stats.conversations,
                href: "/(company)/conversations",
              },
              { label: "Saved", value: stats.saved, href: "/saved" },
            ].map((kpi) => (
              <Pressable
                key={kpi.label}
                onPress={() => router.push(kpi.href as never)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 22,
                    color: colors.text,
                  }}
                >
                  {kpi.value}
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 11,
                    color: colors.textMuted,
                    marginTop: 4,
                  }}
                >
                  {kpi.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Card>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            Suggested next step
          </Text>
          <Subtitle>Review candidates and shortlist strong matches.</Subtitle>
          <Pressable
            onPress={() => router.push("/(company)/candidates")}
            style={{
              marginTop: 14,
              backgroundColor: brand.cta,
              borderRadius: 999,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: "Poppins_600SemiBold", color: "#fff" }}>
              Open Candidates
            </Text>
          </Pressable>
        </Card>

        {stats.connections === 0 && !loading ? (
          <EmptyState
            title="No relationships yet"
            body="When you and a talent both show interest, the connection lands on your board."
            actionLabel="Browse candidates"
            onAction={() => router.push("/(company)/candidates")}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
