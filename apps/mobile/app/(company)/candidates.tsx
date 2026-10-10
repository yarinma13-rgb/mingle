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
  fetchDiscoverCandidatesWithScores,
  loadMatchFeedbackMap,
  type MatchFeedbackAction,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { scoreTone } from "@/src/theme/tokens";

type Candidate = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  location: string | null;
  current_job_title: string | null;
  score: number;
};

export default function CompanyCandidates() {
  const { user } = useAuth();
  const [items, setItems] = useState<Candidate[]>([]);
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
      const [candidates, map] = await Promise.all([
        fetchDiscoverCandidatesWithScores(user.id),
        loadMatchFeedbackMap(user.id),
      ]);
      setItems(candidates as Candidate[]);
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
      <AppHeader title="Candidates" />
      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load candidates"
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
                title="No candidates yet"
                body="Talent profiles will appear here as people join mingle."
              />
            ) : null
          }
          renderItem={({ item }) => {
            const score = item.score;
            const name =
              [item.first_name, item.last_name].filter(Boolean).join(" ") ||
              "Talent";
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
                      {name}
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
                    {[item.current_job_title || item.headline, item.location]
                      .filter(Boolean)
                      .join(" · ") || "Open profile for more detail"}
                  </Body>
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
