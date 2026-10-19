import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Button, Card, EmptyState, Field, LoadingBlock, Screen, Subtitle, Title } from "@/src/components/ui";
import {
  addConnectionExperience,
  deleteConnectionExperience,
  fetchConnectionExperiences,
  setConnectionExperienceDone,
  swapConnectionExperiences,
  type ConnectionExperience,
  type ExperienceKind,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

const PRESETS: { kind: ExperienceKind; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { kind: "meet_manager", title: "Meet the manager", icon: "person" },
  { kind: "team_session", title: "Team session", icon: "people" },
  { kind: "role_simulation", title: "Role simulation", icon: "construct" },
  { kind: "ask_anything", title: "Ask us anything", icon: "help-circle" },
];

function iconFor(kind: ExperienceKind): keyof typeof Ionicons.glyphMap {
  return PRESETS.find((p) => p.kind === kind)?.icon ?? "flag";
}

export default function ConversationExperience() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<ConnectionExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setItems(await fetchConnectionExperiences(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the experience");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function run(action: () => Promise<void>) {
    try {
      await action();
      await load();
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Try again");
    }
  }

  const nextPosition = items.length ? Math.max(...items.map((i) => i.position)) + 1 : 0;
  const allDone = items.length > 0 && items.every((i) => i.done);

  return (
    <Screen>
      <AppHeader title={allDone ? "Experience completed" : "Experience builder"} showBack />
      {loading ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState title="Couldn't load the experience" body={error} actionLabel="Retry" onAction={load} />
        </View>
      ) : null}
      {!loading && !error ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View>
            <Title>Your experience</Title>
            <Subtitle>
              A shared set of steps — meet the team, try the work — that you both can follow and tick off.
            </Subtitle>
          </View>

          {items.length === 0 ? (
            <Card>
              <Body muted>No steps yet. Add the first one below.</Body>
            </Card>
          ) : null}

          {items.map((item, index) => (
            <Card key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.done ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
                onPress={() => run(() => setConnectionExperienceDone(item.id, !item.done))}
              >
                <Ionicons
                  name={item.done ? "checkmark-circle" : "ellipse-outline"}
                  size={26}
                  color={item.done ? brand.accentViolet : colors.textMuted}
                />
              </Pressable>
              <Ionicons name={iconFor(item.kind)} size={18} color={colors.textMuted} />
              <Text
                style={{
                  flex: 1,
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 14,
                  color: colors.text,
                  textDecorationLine: item.done ? "line-through" : "none",
                }}
              >
                {item.title}
              </Text>
              <Pressable
                accessibilityLabel="Move up"
                disabled={index === 0}
                hitSlop={6}
                onPress={() => run(() => swapConnectionExperiences(item, items[index - 1]))}
                style={{ opacity: index === 0 ? 0.25 : 1 }}
              >
                <Ionicons name="chevron-up" size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                accessibilityLabel="Move down"
                disabled={index === items.length - 1}
                hitSlop={6}
                onPress={() => run(() => swapConnectionExperiences(item, items[index + 1]))}
                style={{ opacity: index === items.length - 1 ? 0.25 : 1 }}
              >
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </Pressable>
              {item.created_by === user?.id ? (
                <Pressable
                  accessibilityLabel={`Remove ${item.title}`}
                  hitSlop={6}
                  onPress={() => run(() => deleteConnectionExperience(item.id))}
                >
                  <Ionicons name="trash-outline" size={18} color={brand.error} />
                </Pressable>
              ) : null}
            </Card>
          ))}

          <Card style={{ gap: 10 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text }}>Add a step</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PRESETS.map((preset) => (
                <Pressable
                  key={preset.kind}
                  onPress={() =>
                    user && id
                      ? run(() => addConnectionExperience(id, user.id, preset.kind, preset.title, nextPosition))
                      : undefined
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: colors.lavender,
                  }}
                >
                  <Ionicons name={preset.icon} size={14} color={colors.text} />
                  <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: colors.text }}>
                    {preset.title}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field value={custom} onChangeText={setCustom} placeholder="Or name your own step" />
            <Button
              label="Add step"
              variant="secondary"
              disabled={!custom.trim()}
              onPress={() =>
                user && id
                  ? run(async () => {
                      await addConnectionExperience(id, user.id, "custom", custom, nextPosition);
                      setCustom("");
                    })
                  : undefined
              }
            />
          </Card>
        </ScrollView>
      ) : null}
    </Screen>
  );
}
