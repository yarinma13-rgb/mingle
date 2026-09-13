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
  EmptyState,
  LoadingBlock,
  Screen,
  StatusBadge,
} from "@/src/components/ui";
import { fetchConnections } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

type Row = {
  id: string;
  status: string;
  updated_at: string;
};

export default function TalentConnections() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setRows((await fetchConnections(user.id)) as Row[]);
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
      <AppHeader title="Connections" />
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
              title="No connection requests yet"
              body="When you or a company shows interest, requests land here."
              actionLabel="Discover"
              onAction={() => router.push("/(talent)/discover")}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              item.status === "accepted"
                ? router.push(`/conversation/${item.id}`)
                : undefined
            }
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
              }}
            >
              Connection · {item.id.slice(0, 8)}
            </Text>
            <StatusBadge
              label={item.status}
              tone={
                item.status === "accepted"
                  ? "success"
                  : item.status === "pending"
                    ? "warning"
                    : "neutral"
              }
            />
          </Pressable>
        )}
      />
    </Screen>
  );
}
