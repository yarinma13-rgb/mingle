import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Card,
  EmptyState,
  KpiTile,
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

export default function TalentDashboard() {
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
      setStats(await fetchDashboardStats(user.id));
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
        <Title>Your relationships</Title>
        <Subtitle>
          Pick up where you left off — discover, connect, and keep the
          conversation moving.
        </Subtitle>

        <Card>
          <Body muted>Profile completion</Body>
          <Text
            style={{
              fontFamily: "Figtree_700Bold",
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
                ? "Looking sharp"
                : "Finish your profile to unlock better matches"
            }
            tone={completion >= 80 ? "success" : "warning"}
          />
          <Pressable
            onPress={() => router.push("/profile/build")}
            style={{ marginTop: 12 }}
          >
            <Text
              style={{
                fontFamily: "Figtree_600SemiBold",
                color: brand.cta,
              }}
            >
              Edit profile →
            </Text>
          </Pressable>
        </Card>

        {loading && stats.connections === 0 ? (
          <LoadingBlock />
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <KpiTile
              label="Connections"
              value={stats.connections}
              icon="people"
              tint={brand.purple}
              onPress={() => router.push("/(talent)/connections")}
            />
            <KpiTile
              label="Chats"
              value={stats.conversations}
              icon="chatbubble"
              tint={brand.pink}
              onPress={() => router.push("/(talent)/conversations")}
            />
            <KpiTile
              label="Saved"
              value={stats.saved}
              icon="bookmark"
              tint={brand.blue}
              onPress={() => router.push("/saved")}
            />
          </View>
        )}

        <Card>
          <Text
            style={{
              fontFamily: "Figtree_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            Suggested next step
          </Text>
          <Subtitle>
            Open Discover and react to companies that fit how you work.
          </Subtitle>
          <Pressable
            onPress={() => router.push("/(talent)/discover")}
            style={{
              marginTop: 14,
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Figtree_600SemiBold",
                color: "#fff",
              }}
            >
              Go to Discover
            </Text>
          </Pressable>
        </Card>

        {stats.connections === 0 && !loading ? (
          <EmptyState
            title="No connections yet"
            body="When a company and you both show interest, it becomes a mingle — then the relationship path starts."
            actionLabel="Discover companies"
            onAction={() => router.push("/(talent)/discover")}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
