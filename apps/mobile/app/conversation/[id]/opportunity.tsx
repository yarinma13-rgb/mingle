import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Button,
  Card,
  EmptyState,
  Field,
  Label,
  LoadingBlock,
  Screen,
  Subtitle,
  Title,
} from "@/src/components/ui";
import {
  createOpportunity,
  fetchConnectionById,
  loadDisplayInfoForUsers,
  loadRelationshipTimeline,
  type DisplayInfo,
  type RelationshipEvent,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";

type OpportunityDetails = { role?: string; context?: string };

export default function ConversationOpportunityTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [other, setOther] = useState<DisplayInfo | null>(null);
  const [timeline, setTimeline] = useState<RelationshipEvent[]>([]);
  const [role, setRole] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function handleCreate() {
    if (!id || !user || !role.trim() || !context.trim()) return;
    setSaving(true);
    try {
      const created = await createOpportunity(id, timeline, user.id, {
        role: role.trim(),
        context: context.trim(),
      });
      if (created) {
        setTimeline((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            connection_id: id,
            stage: "opportunity",
            actor_id: user.id,
            metadata: { role: role.trim(), context: context.trim() },
            created_at: new Date().toISOString(),
          },
        ]);
      }
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
        <AppHeader title="Opportunity" showBack />
        <LoadingBlock />
      </Screen>
    );
  }

  const name = other?.name || "them";
  const opportunityEvent = timeline.find((e) => e.stage === "opportunity");
  const details = opportunityEvent?.metadata as OpportunityDetails | undefined;
  const viewerType = profile?.user_type;

  if (!details) {
    if (viewerType === "company") {
      return (
        <Screen>
          <AppHeader title="Opportunity" showBack />
          <View style={{ padding: 16, gap: 12 }}>
            <Title>Explore this candidate</Title>
            <Subtitle>
              Share a role so {name.split(" ")[0]} knows what you have in mind.
            </Subtitle>
            <Card style={{ gap: 4 }}>
              <Field
                label="Role"
                value={role}
                onChangeText={setRole}
                placeholder="Senior product engineer"
                maxLength={120}
              />
              <Field
                label="Context"
                value={context}
                onChangeText={setContext}
                placeholder="What the role involves and why you thought of them for it"
                multiline
                numberOfLines={4}
                maxLength={1200}
              />
              <Button
                label={saving ? "Sharing…" : "Share this opportunity"}
                onPress={handleCreate}
                loading={saving}
                disabled={!role.trim() || !context.trim()}
              />
            </Card>
          </View>
        </Screen>
      );
    }

    return (
      <Screen>
        <AppHeader title="Opportunity" showBack />
        <View style={{ padding: 16 }}>
          <EmptyState
            title="No opportunity yet"
            body={`${name} has not shared a specific role here. Worth asking in conversation.`}
            actionLabel="Open the conversation"
            onAction={() => router.push(`/conversation/${id}`)}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Opportunity" showBack />
      <View style={{ padding: 16, gap: 12 }}>
        <Title>
          {viewerType === "talent" ? "Explore this opportunity" : "Explore this candidate"}
        </Title>
        <Subtitle>
          {viewerType === "talent" ? `From ${name}` : `For ${name}`}
        </Subtitle>
        <Card style={{ gap: 12 }}>
          <View>
            <Label>Role</Label>
            <Body>{details.role}</Body>
          </View>
          <View>
            <Label>Context</Label>
            <Body muted>{details.context}</Body>
          </View>
        </Card>
        <Button
          label="Move to a decision"
          onPress={() => router.push(`/conversation/${id}/decision`)}
        />
      </View>
    </Screen>
  );
}
