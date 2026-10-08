import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  EmptyState,
  LoadingBlock,
  Screen,
  StatusBadge,
} from "@/src/components/ui";
import { fetchEnrichedConnections } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

type Row = Awaited<ReturnType<typeof fetchEnrichedConnections>>[number];

export default function TalentConversations() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await fetchEnrichedConnections(user.id);
      setRows(all.filter((r) => r.status === "accepted"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <AppHeader title="Conversations" />
      {loading && rows.length === 0 ? <LoadingBlock /> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No conversations yet"
              body="Accepted connections open a chat and a relationship path."
              actionLabel="Discover"
              onAction={() => router.push("/(talent)/discover")}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/conversation/${item.id}`)}
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              gap: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
                fontSize: 16,
              }}
            >
              {item.name}
            </Text>
            {item.subtitle ? <Body muted>{item.subtitle}</Body> : null}
            <StatusBadge label="Connected" tone="success" />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                color: brand.cta,
                fontSize: 13,
              }}
            >
              Open chat →
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
