import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
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
import { fetchConnections, fetchRelationshipStage } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

const STAGES = [
  "connected",
  "exploring",
  "in_conversation",
  "interview_booked",
  "opportunity",
  "decision",
  "relationship",
] as const;

type Row = { id: string; status: string; stage?: string };

export default function CompanyPipeline() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<(typeof STAGES)[number]>("connected");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const connections = (await fetchConnections(user.id)).filter(
        (c: { status: string }) => c.status === "accepted",
      ) as Row[];
      const withStages = await Promise.all(
        connections.map(async (c) => ({
          ...c,
          stage: await fetchRelationshipStage(c.id),
        })),
      );
      setRows(withStages);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = rows.filter(
    (r) => (r.stage || "connected") === active,
  );

  return (
    <Screen>
      <AppHeader title="Board" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}
      >
        {STAGES.map((stage) => {
          const selected = stage === active;
          return (
            <Pressable
              key={stage}
              onPress={() => setActive(stage)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: selected
                  ? colors.navActiveBg
                  : colors.surfaceElevated,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: selected
                    ? "Poppins_600SemiBold"
                    : "Poppins_400Regular",
                  fontSize: 12,
                  color: colors.text,
                  textTransform: "capitalize",
                }}
              >
                {stage.replaceAll("_", " ")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {loading && rows.length === 0 ? <LoadingBlock /> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={`No one in ${active.replaceAll("_", " ")}`}
              body="Drop a candidate here once the relationship reaches this stage."
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
              }}
            >
              Relationship · {item.id.slice(0, 8)}
            </Text>
            <StatusBadge label={item.stage || "connected"} tone="info" />
            <Body muted>Open chat & relationship path</Body>
          </Pressable>
        )}
      />
    </Screen>
  );
}
