import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { MatchActions } from "@/src/components/MatchActions";
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
import {
  fetchProfileView,
  loadMatchFeedbackMap,
  type MatchFeedbackAction,
  type ProfileView,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function ProfileViewScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [feedback, setFeedback] = useState<MatchFeedbackAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [view, map] = await Promise.all([
        fetchProfileView(userId),
        user
          ? loadMatchFeedbackMap(user.id)
          : Promise.resolve(
              {} as Record<string, MatchFeedbackAction>,
            ),
      ]);
      setProfile(view);
      setFeedback(map[userId] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <AppHeader title="Profile" showBack />
      {loading && !profile ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load profile"
            body={error}
            actionLabel="Retry"
            onAction={load}
          />
        </View>
      ) : null}
      {profile ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
        >
          <View style={{ gap: 8 }}>
            <StatusBadge
              label={profile.kind === "company" ? "Company" : "Talent"}
              tone="info"
            />
            <Title>{profile.title}</Title>
            {profile.subtitle ? <Subtitle>{profile.subtitle}</Subtitle> : null}
            {profile.location ? <Body muted>{profile.location}</Body> : null}
          </View>

          {profile.meta.length ? (
            <Card>
              <Body muted>Highlights</Body>
              {profile.meta.map((line) => (
                <Text
                  key={line}
                  style={{
                    fontFamily: "Poppins_500Medium",
                    color: colors.text,
                    marginTop: 6,
                  }}
                >
                  {line}
                </Text>
              ))}
            </Card>
          ) : null}

          {profile.about ? (
            <Card>
              <Body muted>About</Body>
              <Body>{profile.about}</Body>
            </Card>
          ) : null}

          {profile.tags.length ? (
            <Card>
              <Body muted>Signals</Body>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {profile.tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins_500Medium",
                        fontSize: 12,
                        color: colors.text,
                      }}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {user && user.id !== profile.userId ? (
            <Card>
              <Body muted>Your move</Body>
              <MatchActions
                actorId={user.id}
                targetUserId={profile.userId}
                initialAction={feedback}
                onDone={({ action }) => setFeedback(action)}
              />
            </Card>
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
