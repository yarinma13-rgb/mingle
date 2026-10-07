import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  expressInterest,
  markNotFit,
  type MatchFeedbackAction,
  type SendConnectionResult,
} from "@/src/lib/api";
import { brand } from "@/src/theme/tokens";

type Props = {
  actorId: string | undefined;
  targetUserId: string;
  initialAction?: MatchFeedbackAction | null;
  onDone?: (result: {
    action: MatchFeedbackAction;
    connection?: SendConnectionResult;
  }) => void;
};

export function MatchActions({
  actorId,
  targetUserId,
  initialAction = null,
  onDone,
}: Props) {
  const [action, setAction] = useState<MatchFeedbackAction | null>(
    initialAction,
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function onInterested() {
    if (!actorId || action === "interested" || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const connection = await expressInterest(actorId, targetUserId);
      setAction("interested");
      const msg =
        connection.outcome === "mutual"
          ? "It's a mingle — you both showed interest."
          : connection.outcome === "already-connected"
            ? "Already connected."
            : "Marked interested.";
      setNote(msg);
      onDone?.({ action: "interested", connection });
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  async function onNotFit() {
    if (!actorId || action === "not_fit" || busy) return;
    setBusy(true);
    setNote(null);
    try {
      await markNotFit(actorId, targetUserId);
      setAction("not_fit");
      setNote("Marked not a fit.");
      onDone?.({ action: "not_fit" });
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <ActionChip
          label={action === "interested" ? "Interested ✓" : "Interested"}
          color={brand.success}
          active={action === "interested"}
          disabled={!actorId || busy || action === "interested"}
          onPress={onInterested}
        />
        <ActionChip
          label={action === "not_fit" ? "Not a fit ✓" : "Not a fit"}
          color={brand.error}
          active={action === "not_fit"}
          disabled={!actorId || busy || action === "not_fit"}
          onPress={onNotFit}
        />
        {busy ? <ActivityIndicator color={brand.cta} /> : null}
      </View>
      {note ? (
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            fontSize: 12,
            color: brand.cta,
          }}
        >
          {note}
        </Text>
      ) : null}
    </View>
  );
}

function ActionChip({
  label,
  color,
  active,
  disabled,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? color : `${color}22`,
        opacity: disabled && !active ? 0.45 : pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "Poppins_600SemiBold",
          fontSize: 12,
          color: active ? "#fff" : color,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
