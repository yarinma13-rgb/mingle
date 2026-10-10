import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Button,
  EmptyState,
  Field,
  LoadingBlock,
  Screen,
  StatusBadge,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { createRole, fetchRoles } from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

type Role = {
  id: string;
  title: string;
  status: string | null;
  work_model: string | null;
  created_at: string;
};

export default function RolesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setRoles((await fetchRoles(user.id)) as Role[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load roles");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onCreate() {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      await createRole({ companyId: user.id, title });
      setTitle("");
      await load();
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
      <AppHeader title="Roles" showBack />
      <View style={{ padding: 16, gap: 8 }}>
        <Title>Open roles</Title>
        <Subtitle>
          Publish roles talent can match against. Paste a job description for AI
          assist next.
        </Subtitle>
        <Field
          label="New role title"
          value={title}
          onChangeText={setTitle}
          placeholder="Senior Product Designer"
        />
        <Button
          label="Add role"
          onPress={onCreate}
          loading={saving}
          disabled={!title.trim()}
        />
        <Pressable onPress={() => router.push("/roles/paste")}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              color: brand.cta,
              marginTop: 4,
            }}
          >
            Paste a job description instead →
          </Text>
        </Pressable>
      </View>
      {loading && roles.length === 0 ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <EmptyState
            title="Couldn't load roles"
            body={error}
            actionLabel="Retry"
            onAction={load}
          />
        </View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 0 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="No roles yet"
                body="Add your first open role to start matching."
              />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/roles/${item.id}`)}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.text,
                  fontSize: 16,
                }}
              >
                {item.title}
              </Text>
              <StatusBadge
                label={item.status || "open"}
                tone={item.status === "open" ? "success" : "neutral"}
              />
              {item.work_model ? <Body muted>{item.work_model}</Body> : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
