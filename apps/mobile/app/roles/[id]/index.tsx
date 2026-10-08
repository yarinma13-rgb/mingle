import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Card,
  EmptyState,
  LoadingBlock,
  Screen,
  StatusBadge,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";

type RoleDetail = {
  id: string;
  title: string;
  status: string | null;
  work_model: string | null;
  description: string | null;
  source_jd: string | null;
  department: string | null;
  seniority: string | null;
};

export default function RoleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qError } = await supabase
        .from("roles")
        .select(
          "id, title, status, work_model, description, source_jd, department, seniority",
        )
        .eq("id", id)
        .maybeSingle();
      if (qError) throw qError;
      setRole((data as RoleDetail | null) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load role");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <AppHeader title="Role" showBack />
      {loading ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Couldn't load role"
            body={error}
            actionLabel="Retry"
            onAction={load}
          />
        </View>
      ) : null}
      {!loading && !error && !role ? (
        <View style={{ padding: 16 }}>
          <EmptyState title="Role not found" body="It may have been removed." />
        </View>
      ) : null}
      {role ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
        >
          <StatusBadge
            label={role.status || "open"}
            tone={role.status === "open" ? "success" : "neutral"}
          />
          <Title>{role.title}</Title>
          <Subtitle>
            {[role.department, role.seniority, role.work_model]
              .filter(Boolean)
              .join(" · ") || "Open role"}
          </Subtitle>
          <Card>
            <Body muted>Description</Body>
            <Body>
              {role.description ||
                role.source_jd ||
                "No description yet — paste a JD from Roles."}
            </Body>
          </Card>
        </ScrollView>
      ) : null}
    </Screen>
  );
}
