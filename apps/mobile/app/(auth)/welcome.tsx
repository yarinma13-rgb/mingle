import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, toggleTheme, theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[brand.accentPink, brand.accentPurple, brand.accentBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          opacity: 0.18,
        }}
      />
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
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {theme === "dark" ? "Light" : "Dark"}
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
          <Image
            source={require("../../assets/images/mingle-mark.png")}
            style={{ width: 88, height: 88, borderRadius: 20 }}
          />
          <Text
            style={{
              fontSize: 34,
              fontWeight: "800",
              color: colors.text,
              letterSpacing: -0.5,
            }}
          >
            mingle
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: colors.textSecondary,
            }}
          >
            Career relationships — not a job board. Match on values, work style,
            and ambition.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={() => router.push("/(auth)/path")}
            style={{ borderRadius: 999, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[brand.accentPink, brand.accentPurple, brand.accentBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Get started
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/sign-in")}
            style={{
              paddingVertical: 14,
              alignItems: "center",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: brand.cta, fontWeight: "700", fontSize: 16 }}>
              I already have an account
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
