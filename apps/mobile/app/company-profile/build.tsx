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
  loadCompanyProfileDraft,
  saveCompanyProfileDraft,
  type CompanyProfileDraft,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";

const EMPTY: CompanyProfileDraft = {
  company_name: "",
  industry: "",
  location: "",
  mission: "",
  description: "",
  company_stage: "",
  company_size: "",
  valuesText: "",
};

export default function CompanyProfileBuild() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<CompanyProfileDraft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setDraft(await loadCompanyProfileDraft(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load company");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function patch<K extends keyof CompanyProfileDraft>(
    key: K,
    value: CompanyProfileDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    if (!user) return;
    setSaving(true);
    try {
      await saveCompanyProfileDraft(user.id, draft);
      await refreshProfile();
      Alert.alert("Saved", "Company profile updated.");
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
      <AppHeader title="Company profile" showBack />
      {loading ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load company"
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
          <Title>Edit company</Title>
          <Subtitle>
            Tell talent what you build and who thrives with you.
          </Subtitle>
          <Field
            label="Company name"
            value={draft.company_name}
            onChangeText={(v) => patch("company_name", v)}
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
            label="Stage"
            value={draft.company_stage}
            onChangeText={(v) => patch("company_stage", v)}
            placeholder="Seed, Series A…"
          />
          <Field
            label="Size"
            value={draft.company_size}
            onChangeText={(v) => patch("company_size", v)}
            placeholder="11–50"
          />
          <Field
            label="Mission"
            value={draft.mission}
            onChangeText={(v) => patch("mission", v)}
          />
          <Field
            label="What you're building"
            value={draft.description}
            onChangeText={(v) => patch("description", v)}
            multiline
          />
          <Field
            label="Values"
            value={draft.valuesText}
            onChangeText={(v) => patch("valuesText", v)}
            placeholder="Ownership, clarity, pace"
          />
          <Button label="Save company" onPress={onSave} loading={saving} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}
