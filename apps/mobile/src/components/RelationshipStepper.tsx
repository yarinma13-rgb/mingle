import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

const STEPS = ["Connected", "Exploring", "Opportunity", "Decision"] as const;

// How far each relationship_events stage counts along the four visible
// steps (see RelationshipStage in api.ts).
const LEVEL: Record<string, number> = {
  connected: 0,
  exploring: 1,
  in_conversation: 1,
  interview_booked: 2,
  opportunity: 2,
  decision: 3,
  relationship: 3,
};

/** Horizontal version of the mockups' relationship timeline: filled check
 *  circles up to the current stage, hollow ones after it. */
export function RelationshipStepper({ stage }: { stage: string }) {
  const { colors } = useTheme();
  const level = LEVEL[stage] ?? 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {STEPS.map((label, i) => {
        const done = i <= level;
        return (
          <View key={label} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "stretch" }}>
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor:
                    i === 0 ? "transparent" : done ? brand.accentViolet : colors.border,
                }}
              />
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: done ? brand.accentViolet : "transparent",
                  borderWidth: done ? 0 : 2,
                  borderColor: colors.border,
                }}
              >
                {done ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor:
                    i === STEPS.length - 1
                      ? "transparent"
                      : i < level
                        ? brand.accentViolet
                        : colors.border,
                }}
              />
            </View>
            <Text
              style={{
                fontFamily: done ? "Poppins_600SemiBold" : "Poppins_400Regular",
                fontSize: 11,
                color: done ? colors.text : colors.textMuted,
              }}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
