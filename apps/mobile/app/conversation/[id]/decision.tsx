import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Card, LoadingBlock, Screen, Subtitle, Title } from "@/src/components/ui";
import {
  fetchConnectionById,
  loadDisplayInfoForUsers,
  loadRelationshipTimeline,
  recordDecision,
  type DecisionChoice,
  type DisplayInfo,
  type RelationshipEvent,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

const CHOICES: {
  choice: DecisionChoice;
  label: string;
  description: string;
  confirmed: string;
}[] = [
  {
    choice: "move_forward",
    label: "Move forward",
    description: "Take the next concrete step together.",
    confirmed: "You chose to move forward.",
  },
  {
    choice: "keep_relationship",
    label: "Keep the relationship",
    description:
      "Not ready for a next step, but stay in touch and open to what's ahead.",
    confirmed: "You're keeping the relationship going.",
  },
  {
    choice: "not_right_fit",
    label: "Not the right fit right now",
    description: "This doesn't feel right at the moment — and that's okay.",
    confirmed: "Noted. This isn't a rejection, just not the right timing.",
  },
  {
    choice: "stay_connected",
    label: "Stay connected",
    description: "Keep the connection without any pressure to move faster.",
    confirmed: "You're staying connected, at your own pace.",
  },
];

export default function ConversationDecisionTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [other, setOther] = useState<DisplayInfo | null>(null);
  const [timeline, setTimeline] = useState<RelationshipEvent[]>([]);

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const connection = await fetchConnectionById(id);
      if (!connection) return;
      const otherId =
        connection.requester_id === user.id
          ? connection.recipient_id
          : connection.requester_id;
      const [display, loadedTimeline] = await Promise.all([
        loadDisplayInfoForUsers([otherId]),
        loadRelationshipTimeline(id),
      ]);
      setOther(display.get(otherId) ?? null);
      setTimeline(loadedTimeline);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleDecide(choice: DecisionChoice) {
    if (!id || !user || saving) return;
    setSaving(true);
    try {
      await recordDecision(id, user.id, choice);
      setTimeline((prev) => [
        ...prev,
        {
          id: `local-decision-${Date.now()}`,
          connection_id: id,
          stage: "decision",
          actor_id: user.id,
          metadata: { choice },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      Alert.alert(
        "Couldn't save that",
        e instanceof Error ? e.message : "Try again in a moment.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Decision" showBack />
        <LoadingBlock />
      </Screen>
    );
  }

  const name = other?.name || "them";
  const decisionEvent = timeline.find((e) => e.stage === "decision");
  const madeChoice = decisionEvent
    ? (decisionEvent.metadata as { choice?: DecisionChoice }).choice
    : null;

  if (madeChoice) {
    const chosen = CHOICES.find((c) => c.choice === madeChoice);
    return (
      <Screen>
        <AppHeader title="Decision" showBack />
        <View style={{ padding: 16, gap: 12 }}>
          <Title>Decision</Title>
          <Subtitle>Your decision about {name} is recorded.</Subtitle>
          <Card style={{ alignItems: "center", gap: 6, paddingVertical: 24 }}>
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 16,
                color: colors.text,
              }}
            >
              {chosen?.label}
            </Text>
            <Body muted>{chosen?.confirmed}</Body>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Decision" showBack />
      <View style={{ padding: 16, gap: 12 }}>
        <Title>What feels right?</Title>
        <Subtitle>
          Not a yes or no about {name} — just where things stand for you.
        </Subtitle>
        <View style={{ gap: 10 }}>
          {CHOICES.map((option) => (
            <Pressable
              key={option.choice}
              onPress={() => handleDecide(option.choice)}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: colors.surfaceElevated,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                gap: 4,
                opacity: saving ? 0.6 : pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 15,
                  color: colors.text,
                }}
              >
                {option.label}
              </Text>
              <Body muted>{option.description}</Body>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
