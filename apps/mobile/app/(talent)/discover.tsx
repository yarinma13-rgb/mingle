import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { MatchActions } from "@/src/components/MatchActions";
import {
  Body,
  Button,
  EmptyState,
  LoadingBlock,
  Screen,
  ScoreRing,
} from "@/src/components/ui";
import {
  fetchDiscoverCompaniesWithScores,
  loadMatchFeedbackMap,
  type MatchFeedbackAction,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

type CompanyCard = {
  user_id: string;
  company_name: string | null;
  industry: string | null;
  location: string | null;
  mission: string | null;
  description: string | null;
  score: number;
  reasons: string[];
};

export default function TalentDiscover() {
  const { user } = useAuth();
  const [items, setItems] = useState<CompanyCard[]>([]);
  const [feedback, setFeedback] = useState<Record<string, MatchFeedbackAction>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [companies, map] = await Promise.all([
        fetchDiscoverCompaniesWithScores(user.id),
        loadMatchFeedbackMap(user.id),
      ]);
      setItems(companies as CompanyCard[]);
      setFeedback(map);
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

  const visible = items.filter((item) => feedback[item.user_id] !== "not_fit");

  return (
    <Screen>
      <AppHeader title="Discover" />
      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load matches"
            body={error}
            actionLabel="Retry"
            onAction={load}
          />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="No companies yet"
                body="When companies publish profiles, they'll show up here."
              />
            ) : null
          }
          renderItem={({ item }) => {
            const score = item.score;
            return (
              <View
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontFamily: "Figtree_700Bold",
                        fontSize: 18,
                        color: colors.text,
                      }}
                    >
                      {item.company_name || "Company"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Figtree_600SemiBold",
                        fontSize: 11,
                        letterSpacing: 0.6,
                        color: colors.textMuted,
                      }}
                    >
                      MINGLE FIT
                    </Text>
                    <Body muted>
                      {[item.industry, item.location].filter(Boolean).join(" · ") ||
                        "Open profile for more detail"}
                    </Body>
                  </View>
                  <ScoreRing score={score} />
                </View>
                {item.reasons.length > 0 ? (
                  <View style={{ gap: 6, marginTop: 4 }}>
                    <Text
                      style={{
                        fontFamily: "Figtree_600SemiBold",
                        fontSize: 13,
                        color: colors.text,
                      }}
                    >
                      Match reasons
                    </Text>
                    {item.reasons.map((reason) => (
                      <View
                        key={reason}
                        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={brand.success}
                        />
                        <Body>{reason}</Body>
                      </View>
                    ))}
                  </View>
                ) : null}
                {item.mission ? <Body muted>{item.mission}</Body> : null}
                <View style={{ marginTop: 6 }}>
                  <Button
                    label="Explore match"
                    onPress={() => router.push(`/profile/view/${item.user_id}`)}
                  />
                </View>
                <MatchActions
                  actorId={user?.id}
                  targetUserId={item.user_id}
                  initialAction={feedback[item.user_id] ?? null}
                  onDone={({ action }) => {
                    setFeedback((prev) => ({
                      ...prev,
                      [item.user_id]: action,
                    }));
                  }}
                />
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
