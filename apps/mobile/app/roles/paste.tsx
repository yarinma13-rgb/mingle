import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Button,
  Field,
  Screen,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { createRole } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";

function titleFromJd(jd: string) {
  const first = jd
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!first) return "New role";
  return first.replace(/^#+\s*/, "").slice(0, 80);
}

export default function PasteRoleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [jd, setJd] = useState("");
  const [saving, setSaving] = useState(false);

  async function onCreate() {
    if (!user || !jd.trim()) return;
    setSaving(true);
    try {
      const role = await createRole({
        companyId: user.id,
        title: titleFromJd(jd),
      });
      // Persist source_jd via a second update if column allows; createRole inserts title first.
      const { supabase } = await import("@/src/lib/supabase");
      await supabase
        .from("roles")
        .update({ source_jd: jd.trim(), description: jd.trim().slice(0, 2000) })
        .eq("id", role.id);
      Alert.alert("Role created", "You can refine it anytime.");
      router.replace(`/roles/${role.id}`);
    } catch (e) {
      Alert.alert(
        "Could not create role",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Paste JD" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Title>Paste a job description</Title>
        <Subtitle>
          Drop the full JD — we create an open role from the first line as title
          and keep the text for matching later.
        </Subtitle>
        <Field
          label="Job description"
          value={jd}
          onChangeText={setJd}
          multiline
          placeholder="Paste the full role description…"
          style={{ minHeight: 220, textAlignVertical: "top" }}
        />
        <View style={{ height: 8 }} />
        <Button
          label="Create role from paste"
          onPress={onCreate}
          loading={saving}
          disabled={!jd.trim()}
        />
      </ScrollView>
    </Screen>
  );
}
