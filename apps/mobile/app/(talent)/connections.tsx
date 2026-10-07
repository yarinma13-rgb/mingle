import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import {
  acceptConnection,
  declineConnection,
  fetchEnrichedConnections,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

type Row = Awaited<ReturnType<typeof fetchEnrichedConnections>>[number];

export default function TalentConnections() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchEnrichedConnections(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onAccept(id: string) {
    setBusyId(id);
    try {
      await acceptConnection(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept");
    } finally {
      setBusyId(null);
    }
  }

  async function onDecline(id: string) {
    setBusyId(id);
    try {
      await declineConnection(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not decline");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen>
      <AppHeader title="Connections" />
      {loading && rows.length === 0 ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load connections"
            body={error}
            actionLabel="Retry"
            onAction={load}
          />
        </View>
      ) : (
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
                  : router.push(`/profile/view/${item.otherUserId}`)
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
                  fontSize: 16,
                }}
              >
                {item.name}
              </Text>
              {item.subtitle ? <Body muted>{item.subtitle}</Body> : null}
              <StatusBadge
                label={
                  item.isIncoming
                    ? "Incoming request"
                    : item.isOutgoing
                      ? "Waiting on them"
                      : item.status
                }
                tone={
                  item.status === "accepted"
                    ? "success"
                    : item.status === "pending"
                      ? "warning"
                      : "neutral"
                }
              />
              {item.isIncoming ? (
                <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                  <Pressable
                    disabled={busyId === item.id}
                    onPress={() => void onAccept(item.id)}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        color: brand.success,
                      }}
                    >
                      Accept
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={busyId === item.id}
                    onPress={() => void onDecline(item.id)}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        color: brand.error,
                      }}
                    >
                      Decline
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {item.status === "accepted" ? (
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    color: brand.cta,
                    fontSize: 13,
                  }}
                >
                  Open conversation →
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
