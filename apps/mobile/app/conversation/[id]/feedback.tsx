import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Button, Card, EmptyState, Field, LoadingBlock, Screen, StarRating, Subtitle, Title } from "@/src/components/ui";
import {
  fetchConnectionExperiences,
  fetchConnectionFeedback,
  giveConnectionFeedback,
  type ConnectionExperience,
  type ConnectionFeedback,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function ConversationFeedback() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [steps, setSteps] = useState<ConnectionExperience[]>([]);
  const [feedback, setFeedback] = useState<ConnectionFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [s, f] = await Promise.all([fetchConnectionExperiences(id), fetchConnectionFeedback(id)]);
      setSteps(s);
      setFeedback(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load feedback");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onSend() {
    if (!id || !user || rating === 0) return;
    setSaving(true);
    try {
      await giveConnectionFeedback({ connectionId: id, authorId: user.id, experienceId: target, rating, comment });
      setRating(0);
      setComment("");
      await load();
    } catch (e) {
      Alert.alert("Couldn't send", e instanceof Error ? e.message : "Try again");
    } finally {
      setSaving(false);
    }
  }

  const titleFor = (experienceId: string | null) =>
    steps.find((s) => s.id === experienceId)?.title ?? "Overall";

  return (
    <Screen>
      <AppHeader title="Feedback" showBack />
      {loading ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState title="Couldn't load feedback" body={error} actionLabel="Retry" onAction={load} />
        </View>
      ) : null}
      {!loading && !error ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View>
            <Title>How did it feel?</Title>
            <Subtitle>Feedback is shared with the other side — keep it direct and kind.</Subtitle>
          </View>

          <Card style={{ gap: 12 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text }}>About</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[{ id: null as string | null, title: "Overall" }, ...steps].map((option) => {
                const on = target === option.id;
                return (
                  <Pressable
                    key={option.id ?? "overall"}
                    onPress={() => setTarget(option.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: on ? colors.primary : colors.lavender,
                    }}
                  >
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: on ? colors.onPrimary : colors.text }}>
                      {option.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <StarRating value={rating} onChange={setRating} />
            <Field
              label="What's one direct thing you'd share?"
              value={comment}
              onChangeText={setComment}
              placeholder="Optional"
              multiline
            />
            <Button label="Send feedback" onPress={onSend} loading={saving} disabled={rating === 0} />
          </Card>

          {feedback.length > 0 ? (
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text, marginTop: 4 }}>
              So far
            </Text>
          ) : null}
          {feedback.map((item) => (
            <Card key={item.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text }}>
                  {titleFor(item.experience_id)} · {item.author_id === user?.id ? "You" : "Them"}
                </Text>
                <StarRating value={item.rating} size={14} />
              </View>
              {item.comment ? <Body>{item.comment}</Body> : null}
            </Card>
          ))}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
