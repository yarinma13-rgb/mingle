import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/providers/ThemeProvider";
import mingleMark from "../../assets/images/mingle-mark.png";

// Matches the approved welcome mockups: flat navy in dark mode, white in
// light mode, centred mark + wordmark, one solid primary CTA.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, toggleTheme, theme } = useTheme();
  const dark = theme === "dark";
  const bg = dark ? colors.header : "#FFFFFF";
  const fg = dark ? "#FFFFFF" : colors.text;
  const sub = dark ? "rgba(255,255,255,0.72)" : colors.textSecondary;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Pressable
            onPress={toggleTheme}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <Ionicons
              name={dark ? "sunny-outline" : "moon-outline"}
              size={22}
              color={fg}
            />
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
          <Image
            source={mingleMark}
            alt="mingle"
            accessibilityLabel="mingle"
            style={{ width: 120, height: 120, borderRadius: 30 }}
          />
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 42,
              color: fg,
              letterSpacing: -1,
              marginTop: 10,
            }}
          >
            mingle
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 17,
              color: dark ? "#B79CFF" : "#7B2FF7",
            }}
          >
            Beyond the match.
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: sub,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Careers start with connection
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Link href="/(auth)/path" asChild>
            <Pressable
              accessibilityRole="button"
              style={{
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>
                Get started
              </Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/sign-in" asChild>
            <Pressable
              accessibilityRole="button"
              style={{ paddingVertical: 14, alignItems: "center" }}
            >
              <Text
                style={{
                  color: dark ? "#FFFFFF" : colors.primary,
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 15,
                }}
              >
                I already have an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
