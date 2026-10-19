import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Button, Card, EmptyState, Field, LoadingBlock, Screen, ScoreRing, StarRating, Subtitle, Title } from "@/src/components/ui";
import {
  addPostHireCheckin,
  alignmentScore,
  fetchPostHireCheckins,
  loadRelationshipTimeline,
  type PostHireCheckin,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

const MARKS = [30, 60, 90] as const;

export default function ConversationCheckIn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [checkins, setCheckins] = useState<PostHireCheckin[]>([]);
  const [movedForward, setMovedForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mark, setMark] = useState<30 | 60 | 90>(30);
  const [expectations, setExpectations] = useState(0);
  const [relationship, setRelationship] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [rows, timeline] = await Promise.all([fetchPostHireCheckins(id), loadRelationshipTimeline(id)]);
      setCheckins(rows);
      setMovedForward(
        timeline.some(
          (e) => e.stage === "decision" && (e.metadata as { choice?: string }).choice === "move_forward",
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load check-ins");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const mineDone = new Set(checkins.filter((c) => c.author_id === user?.id).map((c) => c.day_mark));
  const score = alignmentScore(checkins);

  async function onSave() {
    if (!id || !user || !expectations || !relationship) return;
    setSaving(true);
    try {
      await addPostHireCheckin({ connectionId: id, authorId: user.id, dayMark: mark, expectations, relationship, note });
      setExpectations(0);
      setRelationship(0);
      setNote("");
      await load();
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Post-hire check-in" showBack />
      {loading ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState title="Couldn't load check-ins" body={error} actionLabel="Retry" onAction={load} />
        </View>
      ) : null}
      {!loading && !error && !movedForward && checkins.length === 0 ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Opens after you move forward"
            body="Once either of you chooses “Move forward” in Decision, you can check in at 30, 60 and 90 days."
          />
        </View>
      ) : null}
      {!loading && !error && (movedForward || checkins.length > 0) ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View>
            <Title>90 days: post-hire</Title>
            <Subtitle>A few honest minutes at each milestone keeps the relationship healthy.</Subtitle>
          </View>

          <Card style={{ alignItems: "center", gap: 8 }}>
            {score === null ? (
              <Body muted>No check-ins yet — the alignment score appears after the first one.</Body>
            ) : (
              <>
                <ScoreRing score={score} size={110} color={brand.accentViolet} />
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text }}>
                  Alignment score
                </Text>
                <Body muted>From {checkins.length} check-in{checkins.length === 1 ? "" : "s"} across both sides.</Body>
              </>
            )}
          </Card>

          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {MARKS.map((m) => {
                const done = mineDone.has(m);
                const on = mark === m;
                return (
                  <Pressable
                    key={m}
                    disabled={done}
                    onPress={() => setMark(m)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: on && !done ? colors.primary : colors.lavender,
                      opacity: done ? 0.45 : 1,
                    }}
                  >
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: on && !done ? colors.onPrimary : colors.text }}>
                      {m} days{done ? " ✓" : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {mineDone.size === MARKS.length ? (
              <Body muted>You've completed all three check-ins. Thank you.</Body>
            ) : (
              <>
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text }}>
                  Did reality match expectations?
                </Text>
                <StarRating value={expectations} onChange={setExpectations} />
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text }}>
                  How is the relationship going?
                </Text>
                <StarRating value={relationship} onChange={setRelationship} />
                <Field label="Anything to add?" value={note} onChangeText={setNote} placeholder="Optional" multiline />
                <Button
                  label="Save check-in"
                  onPress={onSave}
                  loading={saving}
                  disabled={!expectations || !relationship || mineDone.has(mark)}
                />
              </>
            )}
          </Card>

          {checkins.map((c) => (
            <Card key={c.id} style={{ gap: 6 }}>
              <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text }}>
                {c.day_mark} days · {c.author_id === user?.id ? "You" : "Them"}
              </Text>
              <StarRating value={Math.round((c.expectations_rating + c.relationship_rating) / 2)} size={14} />
              {c.note ? <Body>{c.note}</Body> : null}
            </Card>
          ))}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
