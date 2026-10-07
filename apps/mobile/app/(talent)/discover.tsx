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
import { MatchActions } from "@/src/components/MatchActions";
import {
  Body,
  EmptyState,
  LoadingBlock,
  Screen,
  StatusBadge,
} from "@/src/components/ui";
import {
  fetchDiscoverCompanies,
  loadMatchFeedbackMap,
  type MatchFeedbackAction,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { scoreTone } from "@/src/theme/tokens";

type CompanyCard = {
  user_id: string;
  company_name: string | null;
  industry: string | null;
  location: string | null;
  mission: string | null;
  description: string | null;
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
    setLoading(true);
    setError(null);
    try {
      const [companies, map] = await Promise.all([
        fetchDiscoverCompanies(),
        user ? loadMatchFeedbackMap(user.id) : Promise.resolve({}),
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
          renderItem={({ item, index }) => {
            const score = 85 - ((index * 7) % 40);
            return (
              <View
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  gap: 8,
                }}
              >
                <Pressable
                  onPress={() => router.push(`/profile/view/${item.user_id}`)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins_700Bold",
                        fontSize: 18,
                        color: colors.text,
                        flex: 1,
                      }}
                    >
                      {item.company_name || "Company"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Poppins_700Bold",
                        fontSize: 18,
                        color: scoreTone(score),
                      }}
                    >
                      {score}%
                    </Text>
                  </View>
                  <StatusBadge
                    label={
                      score >= 70
                        ? "Strong match"
                        : score >= 45
                          ? "Worth a look"
                          : "Low overlap"
                    }
                    tone={
                      score >= 70
                        ? "success"
                        : score >= 45
                          ? "warning"
                          : "danger"
                    }
                  />
                  <Body muted>
                    {[item.industry, item.location].filter(Boolean).join(" · ") ||
                      "Open profile for more detail"}
                  </Body>
                  {item.mission ? <Body>{item.mission}</Body> : null}
                </Pressable>
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
