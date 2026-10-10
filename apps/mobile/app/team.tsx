import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Body,
  Button,
  Card,
  Field,
  LoadingBlock,
  Screen,
  Subtitle,
} from "@/src/components/ui";
import {
  fetchTeamMembers,
  inviteTeammate,
  type TeamMember,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

function roleLabel(role: TeamMember["role"]): string {
  if (role === "team_lead") return "Team lead";
  if (role === "hr") return "HR";
  if (role === "owner") return "Owner";
  return "Member";
}

export default function TeamScreen() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setMembers(await fetchTeamMembers(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onInvite() {
    if (!user || !email.trim()) return;
    setInviting(true);
    try {
      await inviteTeammate(user.id, user.id, email);
      setEmail("");
      await load();
    } catch (e) {
      Alert.alert(
        "Couldn't send invite",
        e instanceof Error ? e.message : "Try again.",
      );
    } finally {
      setInviting(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Team" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Subtitle>People who can hire from this workspace.</Subtitle>

        <Card style={{ gap: 4 }}>
          <Field
            label="Invite by email"
            value={email}
            onChangeText={setEmail}
            placeholder="teammate@company.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button
            label={inviting ? "Inviting…" : "Invite"}
            onPress={onInvite}
            loading={inviting}
            disabled={!email.trim()}
          />
        </Card>

        {loading && members.length === 0 ? <LoadingBlock /> : null}

        <Card style={{ gap: 12 }}>
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 15, color: colors.text }}>
            Members
          </Text>
          <View>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text }}>
              {profile?.email}
            </Text>
            <Body muted>You · Account holder</Body>
          </View>
          {members.map((member) => (
            <View key={member.id}>
              <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text }}>
                {member.email}
              </Text>
              <Body muted>
                {roleLabel(member.role)} ·{" "}
                {member.status === "active" ? "Active" : "Invited"}
              </Body>
            </View>
          ))}
          {members.length === 0 ? (
            <Body muted>
              Invite HR or a team lead when you want them to schedule from this
              same company account.
            </Body>
          ) : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}
