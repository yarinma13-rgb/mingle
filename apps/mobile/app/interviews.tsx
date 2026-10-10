import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Card,
  EmptyState,
  LoadingBlock,
  Screen,
  StatusBadge,
  Subtitle,
} from "@/src/components/ui";
import { fetchInterviewsForViewer, type InterviewItem } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";

function formatInterviewWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status: InterviewItem["status"]) {
  if (status === "completed") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  return "info" as const;
}

export default function InterviewsScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const rows = await fetchInterviewsForViewer(user.id, profile.user_type);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <AppHeader title="Interviews" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Subtitle>
          {profile?.user_type === "company"
            ? "Scheduled conversations with candidates."
            : "Scheduled conversations with companies."}
        </Subtitle>
        {loading && items.length === 0 ? <LoadingBlock /> : null}
        {!loading && items.length === 0 ? (
          <EmptyState
            title="No interviews scheduled yet"
            body="When a relationship reaches a conversation, you can plan the next step from there."
            actionLabel={
              profile?.user_type === "company" ? "Find candidates" : "Discover companies"
            }
            onAction={() =>
              router.push(
                profile?.user_type === "company"
                  ? "/(company)/candidates"
                  : "/(talent)/discover",
              )
            }
          />
        ) : null}
        <View style={{ gap: 12 }}>
          {items.map((interview) => (
            <Card key={interview.id} style={{ gap: 6 }}>
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 15 }}>
                {interview.otherName}
              </Text>
              <Body muted>
                {formatInterviewWhen(interview.scheduledAt)} ·{" "}
                {interview.durationMinutes} min ·{" "}
                {interview.locationType === "video" ? "Video" : "In person"}
              </Body>
              <StatusBadge
                label={
                  interview.status === "scheduled"
                    ? "Scheduled"
                    : interview.status === "completed"
                      ? "Completed"
                      : "Cancelled"
                }
                tone={statusTone(interview.status)}
              />
              {interview.notes ? <Body>{interview.notes}</Body> : null}
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
