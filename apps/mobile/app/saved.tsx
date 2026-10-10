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
  fetchSavedProfiles,
  unsaveProfile,
  type DisplayInfo,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

export default function SavedScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<DisplayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchSavedProfiles(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load saved");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function remove(savedUserId: string) {
    if (!user) return;
    try {
      await unsaveProfile(user.id, savedUserId);
      setItems((prev) => prev.filter((row) => row.userId !== savedUserId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not unsave");
    }
  }

  return (
    <Screen>
      <AppHeader title="Saved" showBack />
      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load saved"
            body={error}
            actionLabel="Retry"
            onAction={load}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="Nothing saved yet"
                body="Tap Interested on Discover to keep profiles here for later."
                actionLabel="Discover"
                onAction={() => router.push("/(talent)/discover")}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                gap: 8,
              }}
            >
              <Pressable
                onPress={() => router.push(`/profile/view/${item.userId}`)}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 16,
                    color: colors.text,
                  }}
                >
                  {item.name}
                </Text>
                {item.subtitle ? <Body muted>{item.subtitle}</Body> : null}
              </Pressable>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <StatusBadge
                  label={item.kind === "company" ? "Company" : "Talent"}
                  tone="info"
                />
                <Pressable onPress={() => void remove(item.userId)}>
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      color: brand.error,
                      fontSize: 13,
                    }}
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
