import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/AppHeader";
import {
  EmptyState,
  Field,
  LoadingBlock,
  Screen,
  StatusBadge,
} from "@/src/components/ui";
import {
  ensureConversation,
  fetchMessages,
  fetchRelationshipStage,
  markConversationRead,
  sendMessage,
  subscribeToMessages,
  type MessageRow,
} from "@/src/lib/api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [stage, setStage] = useState("connected");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const conversation = await ensureConversation(id);
      setConversationId(conversation.id);
      const [msgs, st] = await Promise.all([
        fetchMessages(conversation.id),
        fetchRelationshipStage(id),
      ]);
      setMessages(msgs as MessageRow[]);
      setStage(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Messaging isn't ready yet.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Mark unread messages from the other side as read once we know which
  // conversation we're in — non-critical, the unread badge just catches
  // up next load if this fails.
  useEffect(() => {
    if (!conversationId || !user) return;
    markConversationRead(conversationId, user.id).catch(() => {});
  }, [conversationId, user]);

  // Live incoming messages via Supabase Realtime, same as web
  // (lib/messaging/persistence.ts subscribeToConversation). Dedupe by id
  // since the sender's own optimistic append can race the INSERT event.
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || !user) return;
      const unsubscribe = subscribeToMessages(conversationId, (message) => {
        setMessages((prev) =>
          prev.some((existing) => existing.id === message.id)
            ? prev
            : [...prev, message],
        );
        if (message.sender_id !== user.id) {
          markConversationRead(conversationId, user.id).catch(() => {});
        }
      });
      return unsubscribe;
    }, [conversationId, user]),
  );

  async function onSend() {
    if (!user || !conversationId || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId,
        senderId: user.id,
        body: draft,
      });
      setDraft("");
      setMessages((await fetchMessages(conversationId)) as MessageRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Conversation" showBack />
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {(["chat", "explore", "opportunity", "decision"] as const).map(
          (tab) => (
            <Pressable
              key={tab}
              onPress={() =>
                tab === "chat"
                  ? undefined
                  : router.push(`/conversation/${id}/${tab}`)
              }
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor:
                  tab === "chat" ? colors.navActiveBg : colors.surfaceElevated,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 12,
                  color: colors.text,
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </Text>
            </Pressable>
          ),
        )}
        <StatusBadge label={stage.replaceAll("_", " ")} tone="info" />
      </View>

      {loading ? <LoadingBlock /> : null}
      {error ? (
        <View style={{ padding: 16 }}>
          <EmptyState
            title="Messaging isn't set up yet"
            body={error}
            actionLabel="Try again"
            onAction={load}
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={88}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
            ListEmptyComponent={
              !loading ? (
                <EmptyState
                  title="Start the conversation"
                  body="Say hello and keep the relationship moving."
                />
              ) : null
            }
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              return (
                <View
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    backgroundColor: mine ? brand.cta : colors.surfaceElevated,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      color: mine ? "#fff" : colors.text,
                    }}
                  >
                    {item.body}
                  </Text>
                </View>
              );
            }}
          />
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              padding: 12,
              borderTopWidth: 1,
              borderTopColor: colors.navDivider,
              alignItems: "flex-end",
            }}
          >
            <View style={{ flex: 1 }}>
              <Field
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a message"
                multiline
              />
            </View>
            <Pressable
              onPress={onSend}
              disabled={sending || !draft.trim()}
              style={{
                backgroundColor: brand.cta,
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 12,
                opacity: sending || !draft.trim() ? 0.5 : 1,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  color: "#fff",
                }}
              >
                Send
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}
