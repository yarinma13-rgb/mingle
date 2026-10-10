import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  type Href,
} from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, LoadingBlock, Screen, Subtitle, Title } from "@/src/components/ui";
import {
  ensureStageAtLeast,
  fetchConnectionById,
  loadDisplayInfoForUsers,
  loadRelationshipTimeline,
  type DisplayInfo,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

type ExploreAction = {
  label: string;
  description: string;
  href: Href;
};

function buildActions(
  connectionId: string,
  otherUserId: string,
  viewerType: "talent" | "company",
): ExploreAction[] {
  // Routes are all real (see app/(...) tree), but going through this
  // array loses the template-literal type Expo Router's typed routes
  // need — cast rather than inline four separate Pressables.
  const ownProfileHref = (
    viewerType === "talent" ? "/profile/build" : "/company-profile/build"
  ) as Href;
  return [
    {
      label: "Have a conversation",
      description: "Jump back into the message thread.",
      href: `/conversation/${connectionId}` as Href,
    },
    {
      label: "Learn about the team",
      description: "See their full profile — how they work, what they value.",
      href: `/profile/view/${otherUserId}` as Href,
    },
    {
      label: "Explore the opportunity",
      description: "See the role and why this connection developed.",
      href: `/conversation/${connectionId}/opportunity` as Href,
    },
    {
      label: "Share more about yourself",
      description: "Keep your own profile current.",
      href: ownProfileHref,
    },
  ];
}

export default function ConversationExploreTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [other, setOther] = useState<DisplayInfo | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const connection = await fetchConnectionById(id);
      if (!connection) return;
      const otherId =
        connection.requester_id === user.id
          ? connection.recipient_id
          : connection.requester_id;
      setOtherUserId(otherId);
      const display = await loadDisplayInfoForUsers([otherId]);
      setOther(display.get(otherId) ?? null);

      // Visiting Explore is itself the "beginning to explore" signal.
      const timeline = await loadRelationshipTimeline(id);
      await ensureStageAtLeast(id, "exploring", timeline, user.id);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Explore" showBack />
        <LoadingBlock />
      </Screen>
    );
  }

  const actions =
    id && otherUserId && profile
      ? buildActions(id, otherUserId, profile.user_type)
      : [];
  const name = other?.name || "them";

  return (
    <Screen>
      <AppHeader title="Explore" showBack />
      <View style={{ padding: 16, gap: 12 }}>
        <Title>Explore the relationship</Title>
        <Subtitle>A few ways to keep getting to know {name}.</Subtitle>
        <View style={{ gap: 10 }}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.href)}
              style={({ pressed }) => ({
                backgroundColor: colors.surfaceElevated,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                gap: 4,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 15,
                  color: colors.text,
                }}
              >
                {action.label}
              </Text>
              <Body muted>{action.description}</Body>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
