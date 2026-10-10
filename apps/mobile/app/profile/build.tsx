import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Button,
  EmptyState,
  Field,
  LoadingBlock,
  Screen,
  Subtitle,
  Title,
} from "@/src/components/ui";
import {
  loadTalentProfileDraft,
  saveTalentProfileDraft,
  type TalentProfileDraft,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";

const EMPTY: TalentProfileDraft = {
  first_name: "",
  last_name: "",
  headline: "",
  location: "",
  current_job_title: "",
  industry: "",
  beyond_cv: "",
  skillsText: "",
};

export default function TalentProfileBuild() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<TalentProfileDraft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setDraft(await loadTalentProfileDraft(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function patch<K extends keyof TalentProfileDraft>(
    key: K,
    value: TalentProfileDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    if (!user) return;
    setSaving(true);
    try {
      await saveTalentProfileDraft(user.id, draft);
      await refreshProfile();
      Alert.alert("Saved", "Your talent profile is up to date.");
      router.back();
    } catch (e) {
      Alert.alert(
        "Could not save",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="My profile" showBack />
      {loading ? <LoadingBlock /> : null}
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
      {!loading && !error ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 4, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
        >
          <Title>Edit profile</Title>
          <Subtitle>
            Same fields as the web product — keep this sharp for better matches.
          </Subtitle>
          <Field
            label="First name"
            value={draft.first_name}
            onChangeText={(v) => patch("first_name", v)}
          />
          <Field
            label="Last name"
            value={draft.last_name}
            onChangeText={(v) => patch("last_name", v)}
          />
          <Field
            label="Headline"
            value={draft.headline}
            onChangeText={(v) => patch("headline", v)}
            placeholder="Product designer · systems thinker"
          />
          <Field
            label="Current role"
            value={draft.current_job_title}
            onChangeText={(v) => patch("current_job_title", v)}
          />
          <Field
            label="Industry"
            value={draft.industry}
            onChangeText={(v) => patch("industry", v)}
          />
          <Field
            label="Location"
            value={draft.location}
            onChangeText={(v) => patch("location", v)}
          />
          <Field
            label="Skills"
            value={draft.skillsText}
            onChangeText={(v) => patch("skillsText", v)}
            placeholder="React, TypeScript, Figma"
          />
          <Field
            label="Beyond the CV"
            value={draft.beyond_cv}
            onChangeText={(v) => patch("beyond_cv", v)}
            multiline
            placeholder="What should companies know about how you work?"
          />
          <Button label="Save profile" onPress={onSave} loading={saving} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}
