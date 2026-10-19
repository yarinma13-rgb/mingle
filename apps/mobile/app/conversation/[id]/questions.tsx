import { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Button, Card, EmptyState, Field, LoadingBlock, Screen, Subtitle, Title } from "@/src/components/ui";
import {
  answerConnectionQuestion,
  askConnectionQuestion,
  fetchConnectionQuestions,
  type ConnectionQuestion,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

// Prompts from the "Ask us anything" mockup.
const SUGGESTIONS = [
  "What's the hardest part of this role?",
  "How does the manager give feedback?",
  "What does a typical week look like?",
  "How does the team handle disagreements?",
];

export default function ConversationQuestions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<ConnectionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setItems(await fetchConnectionQuestions(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load questions");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onAsk() {
    if (!id || !user || !draft.trim()) return;
    setBusy(true);
    try {
      await askConnectionQuestion(id, user.id, draft);
      setDraft("");
      await load();
    } catch (e) {
      Alert.alert("Couldn't send", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  async function onAnswer(question: ConnectionQuestion) {
    const text = answers[question.id]?.trim();
    if (!user || !text) return;
    setBusy(true);
    try {
      await answerConnectionQuestion(question.id, user.id, text);
      setAnswers((prev) => ({ ...prev, [question.id]: "" }));
      await load();
    } catch (e) {
      Alert.alert("Couldn't send", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Ask us anything" showBack />
      {loading ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState title="Couldn't load questions" body={error} actionLabel="Retry" onAction={load} />
        </View>
      ) : null}
      {!loading && !error ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            <View>
              <Title>Questions</Title>
              <Subtitle>Ask anything about the role, the team or how you'd work together.</Subtitle>
            </View>

            {items.length === 0 ? (
              <Card>
                <Body muted>No questions yet — start with one of the ideas below.</Body>
              </Card>
            ) : null}

            {items.map((item) => {
              const mine = item.asker_id === user?.id;
              return (
                <Card key={item.id} style={{ gap: 10 }}>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                    <Ionicons name="help-circle" size={20} color={colors.textMuted} />
                    <Text style={{ flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text }}>
                      {item.question}
                    </Text>
                  </View>
                  {item.answer ? (
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                      <Ionicons name="chatbubble-ellipses" size={18} color="#7B2FF7" />
                      <Text style={{ flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.text }}>
                        {item.answer}
                      </Text>
                    </View>
                  ) : mine ? (
                    <Body muted>Waiting for an answer…</Body>
                  ) : (
                    <View>
                      <Field
                        value={answers[item.id] ?? ""}
                        onChangeText={(v) => setAnswers((prev) => ({ ...prev, [item.id]: v }))}
                        placeholder="Write your answer"
                        multiline
                      />
                      <Button label="Answer" onPress={() => onAnswer(item)} loading={busy} disabled={!answers[item.id]?.trim()} />
                    </View>
                  )}
                </Card>
              );
            })}

            <Card style={{ gap: 10 }}>
              <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text }}>
                Ask a question
              </Text>
              <View style={{ gap: 8 }}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setDraft(s)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: colors.lavender,
                    }}
                  >
                    <Text style={{ flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.text }}>
                      {s}
                    </Text>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
              <Field value={draft} onChangeText={setDraft} placeholder="Or write your own" multiline label="Your question" />
              <Button label="Ask" onPress={onAsk} loading={busy} disabled={!draft.trim()} />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </Screen>
  );
}
